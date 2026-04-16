import { ipcMain, shell } from 'electron'
import http from 'http'
import * as settingsService from '../services/settingsService'

// Variables maestras de la App Padre (SOF-IA)
const MP_CLIENT_ID = '6517154980182412' // Usando tu N.º de la aplicación

// ¡IMPORTANTE MANUEL!: Pega aquí tu Client Secret desde el panel de developers (Credenciales de Producción)
const MP_CLIENT_SECRET = 'TU_CLIENT_SECRET_AQUI' 
const REDIRECT_URI = 'http://localhost:8989/callback'

export function registerMpHandlers(): void {
  ipcMain.handle('mp:login', async () => {
    return new Promise((resolve) => {
      const server = http.createServer(async (req, res) => {
        if (req.url && req.url.startsWith('/callback')) {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const code = url.searchParams.get('code')

          if (code) {
            // Mostrar éxito en el navegador
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f8f9fa;">
                  <h1 style="color: #12b842;">¡Vinculación Exitosa!</h1>
                  <p>Mercado Pago se ha conectado con SOF-IA.</p>
                  <p>Ya puedes cerrar esta ventana.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `)

            // Intercambiar código por Token real de Producción
            try {
              const fetchParams = new URLSearchParams()
              fetchParams.append('client_secret', MP_CLIENT_SECRET)
              fetchParams.append('client_id', MP_CLIENT_ID)
              fetchParams.append('grant_type', 'authorization_code')
              fetchParams.append('code', code)
              fetchParams.append('redirect_uri', REDIRECT_URI)

              const response = await fetch('https://api.mercadopago.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
                body: fetchParams
              })

              const data = await response.json()
              
              if (data.access_token) {
                // Guardamos el token en la base de datos de SOF-IA de este cajero/cliente
                settingsService.setSetting('mp_access_token', data.access_token)
                resolve({ ok: true, data: { success: true } })
              } else {
                resolve({ ok: false, error: data.message || 'Error al procesar la autorización.' })
              }
            } catch (err: any) {
              resolve({ ok: false, error: err.message })
            }
          } else {
            res.writeHead(400)
            res.end('No se pudo completar. Cerrar y reintentar.')
            resolve({ ok: false, error: 'No se obtuvo código de Mercado Pago.' })
          }

          // Apagamos el servidorcito que capturó el código
          server.close()
        }
      })

      // Manejar error si el puerto está ocupado para que no "crashee" Electron
      server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          resolve({ ok: false, error: 'El puerto 8989 ya está en uso. Cierra otras aplicaciones que puedan estar ocupándolo.' })
        } else {
          resolve({ ok: false, error: 'Error del servidor local: ' + e.message })
        }
      })

      // Esperar conexiones en el puerto 8989 y disparar el navegador
      server.listen(8989, () => {
        const authUrl = `https://auth.mercadopago.com/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
        shell.openExternal(authUrl)
      })

      // Timeout de 1 minuto para evitar que se quede esperando eternamente
      setTimeout(() => {
        if (server.listening) {
          server.close()
          resolve({ ok: false, error: 'Tiempo de espera agotado. El usuario no completó la vinculación.' })
        }
      }, 60000)
    })
  })
}
