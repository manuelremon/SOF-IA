import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { createHash } from 'crypto'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

let db: ReturnType<typeof drizzle<typeof schema>>
let sqlite: Database.Database

function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'db')
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  return join(dbDir, 'sofia.db')
}

function getMigrationsPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'migrations')
  }
  return join(app.getAppPath(), 'resources/migrations')
}

function seedDefaults(sqliteDb: Database.Database): void {
  // Seed admin user if no users exist
  const userCount = sqliteDb
    .prepare('SELECT COUNT(*) as cnt FROM users')
    .get() as { cnt: number }

  if (userCount.cnt === 0) {
    sqliteDb
      .prepare(
        `INSERT INTO users (name, pin, role, is_active) VALUES (?, ?, ?, ?)`
      )
      .run('Administrador', hashPin('1234'), 'admin', 1)
  }

  // Seed default settings if empty
  const settingsCount = sqliteDb
    .prepare('SELECT COUNT(*) as cnt FROM app_settings')
    .get() as { cnt: number }

  if (settingsCount.cnt === 0) {
    const defaults: [string, string][] = [
      ['business_name', 'Mi Negocio'],
      ['business_address', ''],
      ['business_phone', ''],
      ['business_tax_id', ''],
      ['tax_rate', '21'],
      ['currency', 'ARS'],
      ['receipt_footer', 'Gracias por su compra']
    ]
    const stmt = sqliteDb.prepare(
      'INSERT INTO app_settings (key, value) VALUES (?, ?)'
    )
    for (const [key, value] of defaults) {
      stmt.run(key, value)
    }
  }
}

export function initDb(): void {
  const dbPath = getDbPath()

  // Backup before migration
  if (existsSync(dbPath)) {
    copyFileSync(dbPath, dbPath + '.bak')
  }

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  const migrationsFolder = getMigrationsPath()
  if (existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder })
  }

  applySchemaUpdates(sqlite)
  seedDefaults(sqlite)
  migratePlaintextPins(sqlite)
  createIndexes(sqlite)
}

function applySchemaUpdates(sqliteDb: Database.Database): void {
  const addColumn = (table: string, col: string, def: string): void => {
    try { sqliteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`) } catch { /* already exists */ }
  }
  // Cash registers table
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS cash_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      opened_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      closed_at TEXT,
      opening_amount REAL NOT NULL DEFAULT 0,
      closing_amount REAL,
      expected_amount REAL,
      difference REAL,
      cash_sales REAL NOT NULL DEFAULT 0,
      card_sales REAL NOT NULL DEFAULT 0,
      transfer_sales REAL NOT NULL DEFAULT 0,
      total_sales REAL NOT NULL DEFAULT 0,
      sales_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'abierta'
    )
  `)
  // Discount columns on sales
  addColumn('sales', 'discount_type', 'text')
  addColumn('sales', 'discount_value', 'real NOT NULL DEFAULT 0')
  addColumn('sales', 'discount_total', 'real NOT NULL DEFAULT 0')
  // Discount columns on sale_items
  addColumn('sale_items', 'discount_type', 'text')
  addColumn('sale_items', 'discount_value', 'real NOT NULL DEFAULT 0')
  addColumn('sale_items', 'discount_total', 'real NOT NULL DEFAULT 0')
}

function createIndexes(sqliteDb: Database.Database): void {
  sqliteDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_number ON purchase_orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_goods_receipts_receipt_number ON goods_receipts(receipt_number);
  `)
}

function migratePlaintextPins(sqliteDb: Database.Database): void {
  const users = sqliteDb.prepare('SELECT id, pin FROM users').all() as Array<{ id: number; pin: string }>
  const update = sqliteDb.prepare('UPDATE users SET pin = ? WHERE id = ?')
  for (const user of users) {
    if (user.pin.length !== 64) {
      update.run(hashPin(user.pin), user.id)
    }
  }
}

export function getDb(): typeof db {
  return db
}

export function getSqlite(): Database.Database {
  return sqlite
}
