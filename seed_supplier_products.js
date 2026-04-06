/**
 * Seed script — Vincula proveedores con productos según categoría
 * Ejecutar: node seed_supplier_products.js
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

console.log('DB encontrada:', dbPath)
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Mapeo: nombre de proveedor -> categorías que provee
const supplierCategoryMap = {
  'Distribuidora La Central': ['Almacen', 'Conservas'],
  'Alimentos del Sur S.A.': ['Galletitas', 'Fideos', 'Almacen'],
  'Lácteos Don Julio': ['Lacteos'],
  'Bebidas Express': ['Bebidas'],
  'Frigorífico Pampa': ['Fiambres', 'Carnes'],
  'Panadería Industrial Trigal': ['Panaderia'],
  'Limpieza Total S.R.L.': ['Limpieza', 'Perfumeria'],
  'Golosinas y Snacks Rioplatense': ['Golosinas', 'Snacks', 'Chocolates'],
  'Verdulería Mayorista El Mercado': ['Frutas', 'Verduras'],
  'Congelados Austral': ['Congelados'],
  'Cereales y Legumbres del Norte': ['Cereales', 'Legumbres', 'Harinas'],
  'Distribuidora Marolio': ['Conservas', 'Aceites', 'Condimentos', 'Almacen'],
  'Papelera Bonaerense': ['Descartables', 'Libreria'],
  'Huevos La Granja Feliz': ['Huevos', 'Lacteos'],
  'Yerbas y Especias Misiones': ['Infusiones', 'Especias', 'Yerba']
}

// Get all suppliers
const suppliers = db.prepare('SELECT id, name FROM suppliers WHERE is_active = 1').all()
console.log(`\nProveedores activos: ${suppliers.length}`)

// Get all categories
const categories = db.prepare('SELECT id, name FROM categories').all()
console.log(`Categorías: ${categories.length}`)
categories.forEach(c => console.log(`  - ${c.name} (id: ${c.id})`))

// Get all products with category
const products = db.prepare(`
  SELECT p.id, p.name, p.cost_price, p.category_id, c.name as category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.is_active = 1
`).all()
console.log(`Productos activos: ${products.length}`)

// Create supplier_products table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS supplier_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    supplier_code TEXT,
    supplier_price REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(supplier_id, product_id)
  )
`)

const insertOrUpdate = db.prepare(`
  INSERT INTO supplier_products (supplier_id, product_id, supplier_price, supplier_code)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(supplier_id, product_id) DO UPDATE SET
    supplier_price = excluded.supplier_price,
    updated_at = datetime('now','localtime')
`)

let linked = 0
let skipped = 0

db.transaction(() => {
  for (const supplier of suppliers) {
    const catNames = supplierCategoryMap[supplier.name]
    if (!catNames) {
      console.log(`⊘ Sin mapeo de categorías para: ${supplier.name}`)
      skipped++
      continue
    }

    // Find matching categories (case-insensitive partial match)
    const matchingCatIds = new Set()
    for (const catName of catNames) {
      const lower = catName.toLowerCase()
      for (const cat of categories) {
        if (cat.name.toLowerCase().includes(lower) || lower.includes(cat.name.toLowerCase())) {
          matchingCatIds.add(cat.id)
        }
      }
    }

    if (matchingCatIds.size === 0) {
      console.log(`⊘ Sin categorías coincidentes para: ${supplier.name} (buscó: ${catNames.join(', ')})`)
      skipped++
      continue
    }

    // Link products from matching categories
    const matchingProducts = products.filter(p => matchingCatIds.has(p.category_id))

    for (const product of matchingProducts) {
      // Supplier price = cost_price with a small random variation (-5% to +10%)
      // This simulates different prices from different suppliers
      const variation = 0.95 + Math.random() * 0.15 // 0.95 to 1.10
      const supplierPrice = Math.round(product.cost_price * variation * 100) / 100

      insertOrUpdate.run(supplier.id, product.id, supplierPrice, null)
      linked++
    }

    console.log(`✔ ${supplier.name}: ${matchingProducts.length} productos vinculados (categorías: ${[...matchingCatIds].map(id => categories.find(c => c.id === id)?.name).join(', ')})`)
  }
})()

const total = db.prepare('SELECT COUNT(*) as cnt FROM supplier_products').get()
console.log(`\n✔ ${linked} vínculos creados/actualizados`)
if (skipped > 0) console.log(`⊘ ${skipped} proveedores sin coincidencias`)
console.log(`DB total: ${total.cnt} vínculos proveedor-producto`)

db.close()
console.log('Done!')
