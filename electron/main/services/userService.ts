import { eq, asc, sql } from 'drizzle-orm'
import { createHash } from 'crypto'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

export function listUsers() {
  const db = getDb()
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      role: schema.users.role,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt
    })
    .from(schema.users)
    .orderBy(asc(schema.users.name))
    .all()
}

export function getUserById(id: number) {
  const db = getDb()
  const row = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      role: schema.users.role,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get()
  return row ?? null
}

export function createUser(data: { name: string; pin: string; role?: string }) {
  const db = getDb()
  return db
    .insert(schema.users)
    .values({
      name: data.name,
      pin: hashPin(data.pin),
      role: data.role ?? 'vendedor'
    })
    .returning({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .get()
}

export function updateUser(data: { id: number; name?: string; role?: string; isActive?: boolean }) {
  const db = getDb()
  const { id, ...fields } = data
  const setValues: Record<string, unknown> = { updatedAt: sql`(datetime('now','localtime'))` }
  if (fields.name !== undefined) setValues.name = fields.name
  if (fields.role !== undefined) setValues.role = fields.role
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive
  return db
    .update(schema.users)
    .set(setValues)
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .get()
}

export function deactivateUser(id: number) {
  const db = getDb()
  db.update(schema.users)
    .set({ isActive: false, updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.users.id, id))
    .run()
  return { deleted: true }
}

export function authenticate(name: string, pin: string) {
  const db = getDb()
  const user = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      role: schema.users.role,
      pin: schema.users.pin,
      isActive: schema.users.isActive
    })
    .from(schema.users)
    .where(eq(schema.users.name, name))
    .get()

  if (!user) return null
  if (!user.isActive) return null
  if (user.pin !== hashPin(pin)) return null

  return { id: user.id, name: user.name, role: user.role }
}

export function changePin(data: { id: number; currentPin: string; newPin: string }) {
  const db = getDb()
  const user = db.select().from(schema.users).where(eq(schema.users.id, data.id)).get()
  if (!user) throw new Error('Usuario no encontrado')
  if (user.pin !== hashPin(data.currentPin)) throw new Error('PIN actual incorrecto')

  db.update(schema.users)
    .set({ pin: hashPin(data.newPin), updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.users.id, data.id))
    .run()

  return { success: true }
}
