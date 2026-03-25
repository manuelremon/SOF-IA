/**
 * Seed script — Carga clientes de ejemplo a la DB de SOF-IA
 * Ejecutar: node seed_customers.js
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

const customers = [
  { name: 'María García', phone: '11-5555-0101', email: 'maria.garcia@gmail.com', address: 'Av. Santa Fe 2345, CABA', notes: 'Cliente frecuente. Compra para su kiosco.' },
  { name: 'Juan Pérez', phone: '11-5555-0202', email: 'juanperez@hotmail.com', address: 'Calle Lavalle 567, CABA', notes: 'Paga siempre en efectivo.' },
  { name: 'Carlos López', phone: '11-5555-0303', email: 'carlos.lopez@yahoo.com.ar', address: 'Av. Callao 890, CABA', notes: 'Tiene cuenta corriente. Límite $100.000.' },
  { name: 'Ana Martínez', phone: '11-5555-0404', email: 'anamartinez@gmail.com', address: 'Calle Florida 1234, CABA', notes: 'Compra mayorista para su restaurante.' },
  { name: 'Roberto Fernández', phone: '11-5555-0505', email: 'robertof@outlook.com', address: 'Av. Cabildo 3456, CABA', notes: 'Retira los miércoles.' },
  { name: 'Laura Rodríguez', phone: '11-5555-0606', email: 'laura.rod@gmail.com', address: 'Av. Corrientes 7890, CABA', notes: 'Prefiere productos sin TACC.' },
  { name: 'Diego Sánchez', phone: '11-5555-0707', email: 'dsanchez@empresa.com.ar', address: 'Calle Defensa 456, San Telmo, CABA', notes: 'Compra para oficina. Factura A.' },
  { name: 'Patricia Gómez', phone: '11-5555-0808', email: 'patricia.gomez@gmail.com', address: 'Av. Rivadavia 5678, Caballito, CABA', notes: 'Clienta de hace 3 años. Muy puntual.' },
  { name: 'Miguel Torres', phone: '11-5555-0909', email: 'mtorres@hotmail.com', address: 'Calle Thames 234, Palermo, CABA', notes: 'Dueño de almacén en Palermo. Compra al por mayor.' },
  { name: 'Sofía Díaz', phone: '11-5555-1010', email: 'sofia.diaz@yahoo.com', address: 'Av. San Martín 1567, San Martín, Buenos Aires', notes: 'Compra semanal los viernes.' },
  { name: 'Alejandro Ruiz', phone: '11-5555-1111', email: 'aruiz@gmail.com', address: 'Calle Maipú 789, Vicente López, Buenos Aires', notes: 'Pide delivery. Zona Norte.' },
  { name: 'Valentina Moreno', phone: '11-5555-1212', email: 'valentinamoreno@gmail.com', address: 'Av. Mitre 345, Avellaneda, Buenos Aires', notes: 'Compra para guardería infantil.' },
  { name: 'Fernando Castro', phone: '11-5555-1313', email: 'fcastro@outlook.com.ar', address: 'Calle Belgrano 678, Quilmes, Buenos Aires', notes: 'Comerciante. Revende en su barrio.' },
  { name: 'Lucía Romero', phone: '11-5555-1414', email: 'lucia.romero@gmail.com', address: 'Av. Hipólito Yrigoyen 901, Lomas de Zamora', notes: 'Clienta nueva. Referida por María García.' },
  { name: 'Gabriel Herrera', phone: '11-5555-1515', email: 'gherrera@hotmail.com', address: 'Calle Sarmiento 234, Morón, Buenos Aires', notes: 'Compra mensual grande. Necesita factura.' },
  { name: 'Camila Flores', phone: '11-5555-1616', email: 'camilaflores@gmail.com', address: 'Av. Centenario 567, Lanus, Buenos Aires', notes: 'Paga con transferencia bancaria.' },
  { name: 'Nicolás Acosta', phone: '11-5555-1717', email: 'nacosta@empresa.com', address: 'Calle Italia 890, Banfield, Buenos Aires', notes: 'Encargado de compras de empresa constructora.' },
  { name: 'Marcela Vargas', phone: '11-5555-1818', email: 'mvargas@yahoo.com.ar', address: 'Av. Eva Perón 1234, San Justo, Buenos Aires', notes: 'Tiene dos negocios. Volumen alto.' },
  { name: 'Consumidor Final', phone: '', email: '', address: '', notes: 'Cliente genérico para ventas sin identificar.' },
  { name: 'Club del Barrio', phone: '11-5555-2020', email: 'admin@clubdelbarrio.org.ar', address: 'Calle Constitución 456, CABA', notes: 'Compra para buffet del club. Factura B.' }
]

const check = db.prepare('SELECT id FROM customers WHERE name = ?')
const insert = db.prepare(`
  INSERT INTO customers (name, phone, email, address, notes, is_active)
  VALUES (?, ?, ?, ?, ?, 1)
`)

let inserted = 0
let skipped = 0

db.transaction(() => {
  for (const c of customers) {
    if (check.get(c.name)) { skipped++; continue }
    insert.run(c.name, c.phone, c.email, c.address, c.notes)
    inserted++
  }
})()

const total = db.prepare('SELECT COUNT(*) as cnt FROM customers').get()
console.log(`\n✔ ${inserted} clientes insertados`)
if (skipped > 0) console.log(`⊘ ${skipped} clientes ya existían`)
console.log(`DB total: ${total.cnt} clientes`)

db.close()
console.log('Done!')
