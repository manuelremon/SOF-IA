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

export function getLiveSnapshot() {
  const db = getDb()
  const reg = db
    .select()
    .from(schema.cashRegisters)
    .where(eq(schema.cashRegisters.status, 'abierta'))
    .get()
  if (!reg) return null

  const sqlite = getSqlite()
  const salesData = sqlite.prepare(`
    SELECT
      COUNT(*) as cnt,
      COALESCE(SUM(total), 0) as totalSales,
      COALESCE(SUM(CASE WHEN payment_method = 'efectivo' THEN total ELSE 0 END), 0) as cashSales,
      COALESCE(SUM(CASE WHEN payment_method = 'tarjeta' THEN total ELSE 0 END), 0) as cardSales,
      COALESCE(SUM(CASE WHEN payment_method = 'transferencia' THEN total ELSE 0 END), 0) as transferSales,
      COALESCE(SUM(CASE WHEN payment_method = 'cuenta_corriente' THEN total ELSE 0 END), 0) as creditSales
    FROM sales
    WHERE status = 'completada'
      AND datetime(created_at) >= datetime(?)
  `).get(reg.openedAt) as any

  const cashInRegister = reg.openingAmount + (salesData.cashSales ?? 0)

  return {
    id: reg.id,
    openedAt: reg.openedAt,
    openingAmount: reg.openingAmount,
    cashSales: salesData.cashSales ?? 0,
    cardSales: salesData.cardSales ?? 0,
    transferSales: salesData.transferSales ?? 0,
    creditSales: salesData.creditSales ?? 0,
    totalSales: salesData.totalSales ?? 0,
    salesCount: salesData.cnt ?? 0,
    cashInRegister
  }
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

export function addCash(data: { id: number; amount: number; notes?: string }) {
  const db = getDb()
  const sqlite = getSqlite()
  const reg = db.select().from(schema.cashRegisters).where(eq(schema.cashRegisters.id, data.id)).get()
  if (!reg) throw new Error('Caja no encontrada')
  if (reg.status === 'cerrada') throw new Error('La caja está cerrada')

  sqlite.prepare('UPDATE cash_registers SET opening_amount = opening_amount + ? WHERE id = ?').run(data.amount, data.id)
  
  db.insert(schema.cashMovements).values({
    registerId: data.id,
    type: data.amount > 0 ? 'ingreso' : 'egreso',
    amount: data.amount,
    description: data.notes || (data.amount > 0 ? 'Ingreso manual' : 'Retiro manual')
  }).run()

  if (data.notes) {
    sqlite.prepare('INSERT INTO audit_logs (entity_type, entity_id, action, notes) VALUES (?, ?, ?, ?)').run(
      'cash_register', data.id, 'manual_movement', data.notes
    )
  }

  return true
}

export function getMovements(filters?: { from?: string; to?: string; type?: string }) {
  const sqlite = getSqlite()
  
  let salesQuery = `
    SELECT 
      id as refId,
      'Venta' as docType,
      receipt_number as receiptNumber,
      total as amount,
      payment_method as paymentMethod,
      'ingreso' as type,
      created_at as createdAt,
      status as status
    FROM sales
    WHERE 1=1
  `
  
  let manualQuery = `
    SELECT 
      id as refId,
      'Movimiento Manual' as docType,
      'N/A' as receiptNumber,
      amount as amount,
      'efectivo' as paymentMethod,
      type as type,
      created_at as createdAt,
      'completada' as status
    FROM cash_movements
    WHERE 1=1
  `

  const params: any[] = []
  if (filters?.from) {
    const fromStr = ` AND DATE(created_at) >= '${filters.from}'`
    salesQuery += fromStr
    manualQuery += fromStr
  }
  if (filters?.to) {
    const toStr = ` AND DATE(created_at) <= '${filters.to}'`
    salesQuery += toStr
    manualQuery += toStr
  }

  let fullQuery = `
    SELECT * FROM (${salesQuery} UNION ALL ${manualQuery}) as unified 
    WHERE 1=1
  `
  
  if (filters?.type && filters.type !== 'todos') {
    fullQuery += ` AND type = '${filters.type}'`
  }

  fullQuery += ` ORDER BY datetime(createdAt) DESC LIMIT 100`

  return sqlite.prepare(fullQuery).all()
}
