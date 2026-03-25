import { app, shell, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDb } from './db/connection'
import { registerAllHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function sendNavigate(path: string): void {
  if (mainWindow) mainWindow.webContents.send('navigate', path)
}

function buildAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Inicio',
      click: () => sendNavigate('/dashboard')
    },
    {
      label: 'Ventas',
      click: () => sendNavigate('/ventas')
    },
    {
      label: 'Inventario',
      click: () => sendNavigate('/inventario')
    },
    {
      label: 'Catálogo',
      click: () => sendNavigate('/catalogo')
    },
    {
      label: 'Clientes',
      click: () => sendNavigate('/clientes')
    },
    {
      label: 'Proveedores',
      click: () => sendNavigate('/proveedores')
    },
    {
      label: 'Compras',
      submenu: [
        { label: 'Órdenes de Compra', click: () => sendNavigate('/compras') },
        { label: 'Recepciones', click: () => sendNavigate('/recepciones') }
      ]
    },
    {
      label: 'Reportes',
      click: () => sendNavigate('/reportes')
    },
    {
      label: 'Caja',
      click: () => sendNavigate('/caja')
    },
    {
      label: 'Admin',
      submenu: [
        { label: 'Usuarios', click: () => sendNavigate('/usuarios') },
        { label: 'Configuración', click: () => sendNavigate('/configuracion') },
        { type: 'separator' },
        { label: 'Cerrar sesión', click: () => sendNavigate('/logout') }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'SOF-IA',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.sofia')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDb()
  registerAllHandlers()
  buildAppMenu()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
