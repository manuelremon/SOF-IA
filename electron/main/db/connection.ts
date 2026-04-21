import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { hashPin } from '../utils/auth'

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

  // Seed a default business if none exist
  const businessCount = sqliteDb
    .prepare('SELECT COUNT(*) as cnt FROM businesses')
    .get() as { cnt: number }

  if (businessCount.cnt === 0) {
    const res = sqliteDb
      .prepare(`INSERT INTO businesses (name, industry) VALUES (?, ?)`)
      .run('Local Principal', 'comercio')
    
    const bizId = res.lastInsertRowid
    
    // Link admin user to this business
    const adminUser = sqliteDb.prepare("SELECT id FROM users WHERE role = 'admin'").get() as { id: number } | undefined
    if (adminUser) {
      sqliteDb.prepare('INSERT INTO user_businesses (user_id, business_id) VALUES (?, ?)').run(adminUser.id, bizId)
    }
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
      ['receipt_footer', 'Gracias por su compra'],
      ['afip_cuit', ''],
      ['afip_pto_vta', '1'],
      ['afip_env', 'test'], // 'test' (homologacion) o 'prod' (produccion)
      ['afip_cert_path', ''],
      ['afip_key_path', '']
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

  seedDefaults(sqlite)
  migratePlaintextPins(sqlite)
  createIndexes(sqlite)
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
    CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_supplier_products_product ON supplier_products(product_id);
    CREATE INDEX IF NOT EXISTS idx_customer_accounts_customer ON customer_accounts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_customer_account_movements_account ON customer_account_movements(customer_account_id);
  `)
}

function migratePlaintextPins(sqliteDb: Database.Database): void {
  const users = sqliteDb.prepare('SELECT id, pin FROM users').all() as Array<{ id: number; pin: string }>
  const update = sqliteDb.prepare('UPDATE users SET pin = ? WHERE id = ?')
  for (const user of users) {
    if (user.pin.length === 64) {
      // Force change: we assign a hashed '1234' with the new format for old SHA-256 hashes
      update.run(hashPin('1234'), user.id)
    }
  }
}

export function getDb(): typeof db {
  return db
}

export function getSqlite(): Database.Database {
  return sqlite
}
