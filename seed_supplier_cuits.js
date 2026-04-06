/**
 * Seed script — Puebla CUITs de los proveedores
 * Ejecutar con: npx electron seed_supplier_cuits.js
 */
const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const userDataPath = path.join(
  process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming'),
  'sof-ia',
  'db'
)
const dbPath = path.join(userDataPath, 'sofia.db')

if (!fs.existsSync(dbPath)) {
  console.error('DB no encontrada en:', dbPath)
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Add cuit column if not exists
try { db.exec('ALTER TABLE suppliers ADD COLUMN cuit TEXT') } catch { /* already exists */ }

const cuits = {
  'Distribuidora La Central': '30-71234567-8',
  'Alimentos del Sur S.A.': '30-70987654-3',
  'Lácteos Don Julio': '20-34567890-1',
  'Bebidas Express': '30-71567890-5',
  'Frigorífico Pampa': '30-70123456-9',
  'Panadería Industrial Trigal': '23-29876543-4',
  'Limpieza Total S.R.L.': '30-71890123-2',
  'Golosinas y Snacks Rioplatense': '30-70456789-6',
  'Verdulería Mayorista El Mercado': '20-31234567-0',
  'Congelados Austral': '30-71345678-7',
  'Cereales y Legumbres del Norte': '30-70678901-1',
  'Distribuidora Marolio': '30-50123456-8',
  'Papelera Bonaerense': '30-71012345-4',
  'Huevos La Granja Feliz': '20-28765432-9',
  'Yerbas y Especias Misiones': '30-70234567-3'
}

const update = db.prepare("UPDATE suppliers SET cuit = ? WHERE name = ? AND (cuit IS NULL OR cuit = '')")
let updated = 0

db.transaction(() => {
  for (const [name, cuit] of Object.entries(cuits)) {
    const result = update.run(cuit, name)
    if (result.changes > 0) {
      console.log(`✔ ${name}: ${cuit}`)
      updated++
    }
  }
})()

console.log(`\n${updated} proveedores actualizados con CUIT`)
db.close()
console.log('Done!')
