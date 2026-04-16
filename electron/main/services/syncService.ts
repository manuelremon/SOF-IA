import { getSetting } from './settingsService'
import { getCurrentRegister } from './cashRegisterService'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import { sql, desc } from 'drizzle-orm'

export async function pushSnapshot() {
  const enabled = getSetting('cloud_sync_enabled') === 'true'
  const url = getSetting('cloud_sync_url')
  const token = getSetting('cloud_sync_token')

  if (!enabled || !url) return

  try {
    const db = getDb()
    const currentRegister = getCurrentRegister()
    
    // Resumen de ventas de hoy
    const today = new Date().toISOString().split('T')[0]
    const recentSales = db.select({
      id: schema.sales.id,
      total: schema.sales.total,
      createdAt: schema.sales.createdAt
    })
    .from(schema.sales)
    .where(sql`date(${schema.sales.createdAt}) = ${today}`)
    .orderBy(desc(schema.sales.createdAt))
    .limit(10)
    .all()

    const snapshot = {
      businessName: getSetting('business_name'),
      timestamp: new Date().toISOString(),
      register: currentRegister,
      recentSales,
      stats: {
        totalSalesToday: recentSales.reduce((acc, s) => acc + s.total, 0),
        salesCountToday: recentSales.length
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(snapshot)
    })

    if (!response.ok) {
      console.warn(`[Sync] Error enviando snapshot: ${response.statusText}`)
    } else {
      console.log(`[Sync] Snapshot enviado correctamente a ${url}`)
    }
  } catch (error) {
    console.error('[Sync] Error en el proceso de sincronización:', error)
  }
}

let syncInterval: NodeJS.Timeout | null = null

export function startSyncTimer() {
  if (syncInterval) clearInterval(syncInterval)
  
  const intervalMins = Number(getSetting('cloud_sync_interval_mins')) || 15
  
  // Primer envío a los 10 segundos de arrancar
  setTimeout(pushSnapshot, 10000)
  
  syncInterval = setInterval(pushSnapshot, intervalMins * 60 * 1000)
}
