import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

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
      .run('Administrador', '1234', 'admin', 1)
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

  seedDefaults(sqlite)
}

export function getDb(): typeof db {
  return db
}

export function getSqlite(): Database.Database {
  return sqlite
}
