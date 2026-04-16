import express from 'express'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import os from 'os'
import path from 'path'
import { app } from 'electron'

export function startExpressServer(port = 3001) {
  const server = express()
  server.use(express.json())

  // Servir el cliente móvil estático
  const mobilePath = app.isPackaged 
    ? path.join(process.resourcesPath, 'mobile')
    : path.join(__dirname, '../../resources/mobile')
  
  server.use(express.static(mobilePath))

  // API para el cliente móvil
  server.get('/api/products', (req, res) => {
    try {
      const db = getDb()
      const query = req.query.q as string
      const results = db.select()
        .from(schema.products)
        .where(schema.products.isActive)
        .all()
      
      const filtered = query 
        ? results.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode === query)
        : results.slice(0, 50)

      res.json({ ok: true, data: filtered })
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message })
    }
  })

  server.post('/api/draft-orders', (req, res) => {
    try {
      const db = getDb()
      const { items, total, deviceName } = req.body
      
      db.insert(schema.draftOrders).values({
        itemsJson: JSON.stringify(items),
        total: total || 0,
        deviceName: deviceName || 'Mobile Device',
        status: 'pendiente'
      }).run()

      res.json({ ok: true, message: 'Orden enviada a caja' })
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message })
    }
  })

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Rompefilas] Servidor corriendo en http://localhost:${port}`)
  })
}

export function getLocalIp() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}
