import { eq, like, and, asc, sql } from 'drizzle-orm'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

export function listCustomers(filters?: { search?: string; isActive?: boolean }) {
  const db = getDb()
  const conditions = []
  if (filters?.search) conditions.push(like(schema.customers.name, `%${filters.search}%`))
  if (filters?.isActive !== undefined) conditions.push(eq(schema.customers.isActive, filters.isActive))
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  return db.select().from(schema.customers).where(whereClause).orderBy(asc(schema.customers.name)).all()
}

export function getCustomerById(id: number) {
  const db = getDb()
  return db.select().from(schema.customers).where(eq(schema.customers.id, id)).get() ?? null
}

export function createCustomer(data: { name: string; phone?: string; email?: string; address?: string; notes?: string }) {
  const db = getDb()
  return db
    .insert(schema.customers)
    .values({
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null
    })
    .returning()
    .get()
}

export function updateCustomer(data: { id: number; name?: string; phone?: string | null; email?: string | null; address?: string | null; notes?: string | null; isActive?: boolean }) {
  const db = getDb()
  const { id, ...fields } = data
  const setValues: Record<string, unknown> = { updatedAt: sql`(datetime('now','localtime'))` }
  if (fields.name !== undefined) setValues.name = fields.name
  if (fields.phone !== undefined) setValues.phone = fields.phone
  if (fields.email !== undefined) setValues.email = fields.email
  if (fields.address !== undefined) setValues.address = fields.address
  if (fields.notes !== undefined) setValues.notes = fields.notes
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive
  return db.update(schema.customers).set(setValues).where(eq(schema.customers.id, id)).returning().get()
}

export function deleteCustomer(id: number) {
  const db = getDb()
  db.update(schema.customers)
    .set({ isActive: false, updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.customers.id, id))
    .run()
  return { deleted: true }
}
