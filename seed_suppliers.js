/**
 * Seed script — Carga proveedores de ejemplo a la DB de SOF-IA
 * Ejecutar: node seed_suppliers.js
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
  console.error('Ejecuta la app al menos una vez con "npm run dev" para que se cree la DB.')
  process.exit(1)
}

console.log('DB encontrada:', dbPath)
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const suppliers = [
  { name: 'Distribuidora La Central', phone: '11-4555-1234', email: 'ventas@lacentral.com.ar', address: 'Av. Corrientes 3456, CABA', notes: 'Proveedor principal de almacén. Entrega lunes y jueves.' },
  { name: 'Alimentos del Sur S.A.', phone: '11-4888-5678', email: 'pedidos@alimentosdelsur.com.ar', address: 'Ruta 3 Km 42, Ezeiza, Buenos Aires', notes: 'Galletitas, fideos, arroz. Mínimo de compra $50.000.' },
  { name: 'Lácteos Don Julio', phone: '11-3456-7890', email: 'contacto@lacteosdonjulio.com', address: 'Parque Industrial Pilar, Buenos Aires', notes: 'Leche, yogurt, quesos. Cadena de frío. Entrega diaria.' },
  { name: 'Bebidas Express', phone: '11-5678-2345', email: 'pedidos@bebidasexpress.com.ar', address: 'Av. Rivadavia 8900, CABA', notes: 'Gaseosas, aguas, jugos. Descuento 5% pago contado.' },
  { name: 'Frigorífico Pampa', phone: '11-4321-6789', email: 'ventas@frigoríficopampa.com.ar', address: 'Av. Chiclana 1200, CABA', notes: 'Carnes, fiambres, embutidos. Requiere pedido 48hs antes.' },
  { name: 'Panadería Industrial Trigal', phone: '11-6789-0123', email: 'distribución@trigal.com.ar', address: 'Calle 44 N° 567, La Plata', notes: 'Pan, facturas, bizcochos. Entrega antes de las 8am.' },
  { name: 'Limpieza Total S.R.L.', phone: '11-5555-4444', email: 'info@limpiezatotal.com.ar', address: 'Av. San Martín 2345, San Martín, Buenos Aires', notes: 'Productos de limpieza y perfumería. Mínimo 20 unidades por ítem.' },
  { name: 'Golosinas y Snacks Rioplatense', phone: '11-4444-3333', email: 'mayorista@golosinasrioplatense.com.ar', address: 'Av. Independencia 4567, CABA', notes: 'Golosinas, chocolates, snacks. Bonificación por volumen.' },
  { name: 'Verdulería Mayorista El Mercado', phone: '11-3333-2222', email: 'pedidos@elmercadomayorista.com', address: 'Mercado Central, Tapiales, Buenos Aires', notes: 'Frutas y verduras frescas. Entrega martes, jueves y sábado.' },
  { name: 'Congelados Austral', phone: '11-2222-1111', email: 'ventas@congeladosaustral.com.ar', address: 'Parque Industrial Burzaco, Buenos Aires', notes: 'Productos congelados: empanadas, pizzas, papas. Mantener cadena de frío.' },
  { name: 'Cereales y Legumbres del Norte', phone: '11-7777-8888', email: 'info@cerealesdelnorte.com.ar', address: 'Ruta 9 Km 15, Campana, Buenos Aires', notes: 'Arroz, lentejas, porotos, harinas. Venta por bolsas de 25kg y 50kg.' },
  { name: 'Distribuidora Marolio', phone: '11-4000-5000', email: 'distribución@marolio.com.ar', address: 'Av. Belgrano 1567, CABA', notes: 'Conservas, aceites, vinagres, condimentos. Línea completa.' },
  { name: 'Papelera Bonaerense', phone: '11-6000-7000', email: 'ventas@papelerabonaerense.com.ar', address: 'Av. Mitre 890, Avellaneda, Buenos Aires', notes: 'Bolsas, papel, servilletas, artículos descartables.' },
  { name: 'Huevos La Granja Feliz', phone: '11-8000-9000', email: 'pedidos@lagranjafeliz.com.ar', address: 'Ruta 6 Km 78, Mercedes, Buenos Aires', notes: 'Huevos frescos por maple. Entrega 3 veces por semana.' },
  { name: 'Yerbas y Especias Misiones', phone: '376-444-5555', email: 'exporta@yerbasymisiones.com.ar', address: 'Ruta 12 Km 5, Posadas, Misiones', notes: 'Yerba mate, té, especias. Envío por transporte cada 15 días.' }
]

const check = db.prepare('SELECT id FROM suppliers WHERE name = ?')
const insert = db.prepare(`
  INSERT INTO suppliers (name, phone, email, address, notes, is_active)
  VALUES (?, ?, ?, ?, ?, 1)
`)

let inserted = 0
let skipped = 0

db.transaction(() => {
  for (const s of suppliers) {
    if (check.get(s.name)) { skipped++; continue }
    insert.run(s.name, s.phone, s.email, s.address, s.notes)
    inserted++
  }
})()

const total = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get()
console.log(`\n✔ ${inserted} proveedores insertados`)
if (skipped > 0) console.log(`⊘ ${skipped} proveedores ya existían`)
console.log(`DB total: ${total.cnt} proveedores`)

db.close()
console.log('Done!')
