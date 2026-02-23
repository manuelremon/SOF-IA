import { eq } from 'drizzle-orm'
import { getDb } from '../db/connection'
import { appSettings } from '../db/schema'

const DEFAULTS: Record<string, string> = {
  business_name: 'Mi Negocio',
  business_address: '',
  business_phone: '',
  business_tax_id: '',
  tax_rate: '21',
  currency: 'ARS',
  receipt_footer: 'Gracias por su compra'
}

export function getSetting(key: string): string {
  const db = getDb()
  const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get()
  return row?.value ?? DEFAULTS[key] ?? ''
}

export function setSetting(key: string, value: string): void {
  const db = getDb()
  db.insert(appSettings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date().toISOString() }
    })
    .run()
}

export function getAllSettings(): Record<string, string> {
  const db = getDb()
  const rows = db.select().from(appSettings).all()
  const result = { ...DEFAULTS }
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

export function setSettingsBatch(entries: Record<string, string>): void {
  for (const [key, value] of Object.entries(entries)) {
    setSetting(key, value)
  }
}
