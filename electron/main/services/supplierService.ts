import { eq, like, and, asc, sql } from 'drizzle-orm'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

export function listSuppliers(filters?: { search?: string; isActive?: boolean }) {
  const db = getDb()
  const conditions = []
  if (filters?.search) conditions.push(like(schema.suppliers.name, `%${filters.search}%`))
  if (filters?.isActive !== undefined) conditions.push(eq(schema.suppliers.isActive, filters.isActive))
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  return db.select().from(schema.suppliers).where(whereClause).orderBy(asc(schema.suppliers.name)).all()
}

export function getSupplierById(id: number) {
  const db = getDb()
  return db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).get() ?? null
}

export function createSupplier(data: { name: string; cuit?: string; phone?: string; email?: string; address?: string; notes?: string }) {
  const db = getDb()

  // Check duplicate name
  const byName = db.select().from(schema.suppliers)
    .where(and(eq(schema.suppliers.name, data.name), eq(schema.suppliers.isActive, true)))
    .get()
  if (byName) throw new Error(`Ya existe un proveedor con el nombre "${data.name}"`)

  // Check duplicate CUIT
  if (data.cuit) {
    const byCuit = db.select().from(schema.suppliers)
      .where(and(eq(schema.suppliers.cuit, data.cuit), eq(schema.suppliers.isActive, true)))
      .get()
    if (byCuit) throw new Error(`Ya existe un proveedor con el CUIT "${data.cuit}" (${byCuit.name})`)
  }

  return db
    .insert(schema.suppliers)
    .values({
      name: data.name,
      cuit: data.cuit ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null
    })
    .returning()
    .get()
}

export function updateSupplier(data: { id: number; name?: string; cuit?: string | null; phone?: string | null; email?: string | null; address?: string | null; notes?: string | null; isActive?: boolean }) {
  const db = getDb()
  const { id, ...fields } = data
  const setValues: Record<string, unknown> = { updatedAt: sql`(datetime('now','localtime'))` }
  if (fields.name !== undefined) setValues.name = fields.name
  if (fields.cuit !== undefined) setValues.cuit = fields.cuit
  if (fields.phone !== undefined) setValues.phone = fields.phone
  if (fields.email !== undefined) setValues.email = fields.email
  if (fields.address !== undefined) setValues.address = fields.address
  if (fields.notes !== undefined) setValues.notes = fields.notes
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive
  return db.update(schema.suppliers).set(setValues).where(eq(schema.suppliers.id, id)).returning().get()
}

export function deleteSupplier(id: number) {
  const db = getDb()
  db.update(schema.suppliers)
    .set({ isActive: false, updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.suppliers.id, id))
    .run()
  return { deleted: true }
}
