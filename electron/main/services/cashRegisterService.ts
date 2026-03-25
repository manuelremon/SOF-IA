import { eq, and, desc, sql } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export function openRegister(data: { userId: number; openingAmount: number }) {
  const db = getDb()
  // Check no open register exists
  const existing = db
    .select()
    .from(schema.cashRegisters)
    .where(eq(schema.cashRegisters.status, 'abierta'))
    .get()
  if (existing) throw new Error('Ya hay una caja abierta. Ciérrela antes de abrir otra.')

  return db
    .insert(schema.cashRegisters)
    .values({
      userId: data.userId,
      openingAmount: data.openingAmount,
      status: 'abierta'
    })
    .returning()
    .get()
}

export function getCurrentRegister() {
  const db = getDb()
  const reg = db
    .select({
      id: schema.cashRegisters.id,
      userId: schema.cashRegisters.userId,
      openedAt: schema.cashRegisters.openedAt,
      openingAmount: schema.cashRegisters.openingAmount,
      cashSales: schema.cashRegisters.cashSales,
      cardSales: schema.cashRegisters.cardSales,
      transferSales: schema.cashRegisters.transferSales,
      totalSales: schema.cashRegisters.totalSales,
      salesCount: schema.cashRegisters.salesCount,
      status: schema.cashRegisters.status,
      userName: schema.users.name
    })
    .from(schema.cashRegisters)
    .leftJoin(schema.users, eq(schema.cashRegisters.userId, schema.users.id))
    .where(eq(schema.cashRegisters.status, 'abierta'))
    .get()
  return reg ?? null
}

export function closeRegister(data: { id: number; closingAmount: number; notes?: string }) {
  const db = getDb()
  const reg = db.select().from(schema.cashRegisters).where(eq(schema.cashRegisters.id, data.id)).get()
  if (!reg) throw new Error('Caja no encontrada')
  if (reg.status === 'cerrada') throw new Error('La caja ya está cerrada')

  // Recalculate sales from DB for accuracy
  const sqlite = getSqlite()
  const salesData = sqlite.prepare(`
    SELECT
      COUNT(*) as cnt,
      COALESCE(SUM(total), 0) as totalSales,
      COALESCE(SUM(CASE WHEN payment_method = 'efectivo' THEN total ELSE 0 END), 0) as cashSales,
      COALESCE(SUM(CASE WHEN payment_method = 'tarjeta' THEN total ELSE 0 END), 0) as cardSales,
      COALESCE(SUM(CASE WHEN payment_method = 'transferencia' THEN total ELSE 0 END), 0) as transferSales
    FROM sales
    WHERE status = 'completada'
      AND datetime(created_at) >= datetime(?)
  `).get(reg.openedAt) as any

  const expectedAmount = reg.openingAmount + (salesData.cashSales ?? 0)
  const difference = data.closingAmount - expectedAmount

  return db
    .update(schema.cashRegisters)
    .set({
      closedAt: sql`(datetime('now','localtime'))`,
      closingAmount: data.closingAmount,
      expectedAmount,
      difference,
      cashSales: salesData.cashSales ?? 0,
      cardSales: salesData.cardSales ?? 0,
      transferSales: salesData.transferSales ?? 0,
      totalSales: salesData.totalSales ?? 0,
      salesCount: salesData.cnt ?? 0,
      notes: data.notes ?? null,
      status: 'cerrada'
    })
    .where(eq(schema.cashRegisters.id, data.id))
    .returning()
    .get()
}

export function listRegisters(limit = 20) {
  const db = getDb()
  return db
    .select({
      id: schema.cashRegisters.id,
      userId: schema.cashRegisters.userId,
      openedAt: schema.cashRegisters.openedAt,
      closedAt: schema.cashRegisters.closedAt,
      openingAmount: schema.cashRegisters.openingAmount,
      closingAmount: schema.cashRegisters.closingAmount,
      expectedAmount: schema.cashRegisters.expectedAmount,
      difference: schema.cashRegisters.difference,
      totalSales: schema.cashRegisters.totalSales,
      salesCount: schema.cashRegisters.salesCount,
      status: schema.cashRegisters.status,
      userName: schema.users.name
    })
    .from(schema.cashRegisters)
    .leftJoin(schema.users, eq(schema.cashRegisters.userId, schema.users.id))
    .orderBy(desc(schema.cashRegisters.openedAt))
    .limit(limit)
    .all()
}
