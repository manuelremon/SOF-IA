/**
 * Seed script — Carga el catálogo de productos desde CSV a la DB de SOF-IA
 * Ejecutar: node seed_products.js
 * Luego: npm run postinstall (para re-compilar better-sqlite3 para Electron)
 */
const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// Find DB path
const userDataPath = path.join(
  process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming'),
  'sof-ia',
  'db'
)
const dbPath = path.join(userDataPath, 'sofia.db')

if (!fs.existsSync(dbPath)) {
  console.error('DB no encontrada en:', dbPath)
  console.error('Ejecuta la app al menos una vez con "npm run dev" para que se cree la DB.')
  process.exit(1)
}

console.log('DB encontrada:', dbPath)
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Read CSV
const csvPath = process.argv[2] || path.join(process.cwd(), 'catalogoproductos.csv')
const raw = fs.readFileSync(csvPath, 'utf-8')
const lines = raw.split('\n').filter(l => l.trim())

// Parse CSV (format: "SKU;Categoria;Producto;Precio")
const rows = []
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].replace(/^"/, '').replace(/"$/, '').trim()
  if (!line || line.startsWith('[')) continue
  const parts = line.split(';')
  if (parts.length < 4) continue
  rows.push({
    sku: parts[0].trim(),
    category: parts[1].trim(),
    name: parts[2].trim(),
    price: parseFloat(parts[3].trim()) || 0
  })
}

console.log(`Parsed ${rows.length} productos del CSV`)

// Unique categories
const categoryNames = [...new Set(rows.map(r => r.category))]
console.log(`Categorías: ${categoryNames.join(', ')}`)

const COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#2980B9', '#D35400', '#7F8C8D']

// Insert categories
const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)')
const getCatId = db.prepare('SELECT id FROM categories WHERE name = ?')

const catMap = {}
db.transaction(() => {
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i]
    let row = getCatId.get(name)
    if (!row) {
      insertCat.run(name, COLORS[i % COLORS.length])
      row = getCatId.get(name)
    }
    catMap[name] = row.id
  }
})()

console.log(`${Object.keys(catMap).length} categorías insertadas/verificadas`)

// Insert products
const checkSku = db.prepare('SELECT id FROM products WHERE sku = ?')
const insertProd = db.prepare(`
  INSERT INTO products (sku, category_id, name, sale_price, cost_price, stock, min_stock, unit, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

let inserted = 0
let skipped = 0

db.transaction(() => {
  for (const row of rows) {
    if (checkSku.get(row.sku)) { skipped++; continue }
    const categoryId = catMap[row.category] || null
    const costPrice = Math.round(row.price * 0.6)
    const stock = Math.floor(Math.random() * 40) + 10
    insertProd.run(row.sku, categoryId, row.name, row.price, costPrice, stock, 5, 'unidad', 1)
    inserted++
  }
})()

const total = db.prepare('SELECT COUNT(*) as cnt FROM products').get()
const cats = db.prepare('SELECT COUNT(*) as cnt FROM categories').get()

console.log(`\n✔ ${inserted} productos insertados`)
if (skipped > 0) console.log(`⊘ ${skipped} productos ya existían`)
console.log(`DB total: ${total.cnt} productos, ${cats.cnt} categorías`)

db.close()
console.log('Done!')
