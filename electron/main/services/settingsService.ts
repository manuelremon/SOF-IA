import { eq, sql } from 'drizzle-orm'
import { getDb } from '../db/connection'
import { appSettings } from '../db/schema'

const DEFAULTS: Record<string, string> = {
  business_name: 'Mi Negocio',
  business_address: '',
  business_city: '',
  business_province: '',
  business_postal_code: '',
  business_phone: '',
  business_phone_alt: '',
  business_email: '',
  mp_access_token: '',
  mp_pos_id: 'CAJA_01',
  whatsapp_access_token: '',
  whatsapp_phone_id: '',
  business_tax_id: '',
  tax_rate: '21',
  currency: 'ARS',
  receipt_footer: 'Gracias por su compra',
  auto_backup_interval_hours: '3',
  theme: 'sap',
  color_scheme: 'light',
  sounds_enabled: 'true',
  font_size_scale: '0',
  font_family: 'inter',
  scanner_mode: 'both',
  aiApiKey: '',
  ai_model: 'gemini-1.5-flash',
  autopilot_coverage_days: '30',
  autopilot_lead_time_days: '7',
  cloud_sync_enabled: 'false',
  cloud_sync_url: '',
  cloud_sync_token: '',
  cloud_sync_interval_mins: '15',
  afip_cuit: '',
  afip_pto_vta: '1',
  afip_env: 'test',
  afip_cert_path: '',
  afip_key_path: ''
}

export function getSetting(key: string): string {
  const db = getDb()
  const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get()
  return row?.value ?? DEFAULTS[key] ?? ''
}

export function setSetting(key: string, value: string | null | undefined): void {
  const db = getDb()
  const safeValue = value ?? DEFAULTS[key] ?? ''
  
  db.insert(appSettings)
    .values({ key, value: String(safeValue), updatedAt: sql`(datetime('now','localtime'))` })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: String(safeValue), updatedAt: sql`(datetime('now','localtime'))` }
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

export function setSettingsBatch(entries: Record<string, string | null | undefined>): void {
  for (const [key, value] of Object.entries(entries)) {
    setSetting(key, value)
  }
}
