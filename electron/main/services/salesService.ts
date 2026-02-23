import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export function completeSale(data: {
  userId?: number
  customerId?: number
  paymentMethod: string
  amountTendered: number
  taxRate: number
  items: Array<{
    productId: number
    productName: string
    quantity: number
    unitPrice: number
  }>
  notes?: string
}) {
  const db = getDb()
  const receiptNumber = generateReceiptNumber()

  let subtotal = 0
  const computedItems = data.items.map((item) => {
    const lineTotal = item.quantity * item.unitPrice
    subtotal += lineTotal
    return { ...item, lineTotal }
  })

  const taxTotal = subtotal * (data.taxRate / 100)
  const total = subtotal + taxTotal
  const change = data.paymentMethod === 'efectivo' ? Math.max(0, data.amountTendered - total) : 0

  const result = getSqlite().transaction(() => {
    const sale = db
      .insert(schema.sales)
      .values({
        userId: data.userId ?? null,
        customerId: data.customerId ?? null,
        receiptNumber,
        subtotal,
        taxTotal,
        total,
        amountTendered: data.amountTendered,
        change,
        paymentMethod: data.paymentMethod,
        status: 'completada',
        notes: data.notes ?? null
      })
      .returning()
      .get()

    const items = computedItems.map((item) => {
      return db
        .insert(schema.saleItems)
        .values({
          saleId: sale.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        })
        .returning()
        .get()
    })

    // Decrement stock
    for (const item of data.items) {
      db.update(schema.products)
        .set({
          stock: sql`stock - ${item.quantity}`,
          updatedAt: sql`(datetime('now','localtime'))`
        })
        .where(eq(schema.products.id, item.productId))
        .run()
    }

    return { ...sale, items }
  })()

  return result
}

export function listSales(filters?: { from?: string; to?: string; paymentMethod?: string; customerId?: number }) {
  const db = getDb()
  const conditions = []
  if (filters?.from) conditions.push(gte(schema.sales.createdAt, filters.from))
  if (filters?.to) conditions.push(lte(schema.sales.createdAt, filters.to))
  if (filters?.paymentMethod) conditions.push(eq(schema.sales.paymentMethod, filters.paymentMethod))
  if (filters?.customerId !== undefined) conditions.push(eq(schema.sales.customerId, filters.customerId))
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select({
      id: schema.sales.id,
      customerId: schema.sales.customerId,
      userId: schema.sales.userId,
      receiptNumber: schema.sales.receiptNumber,
      subtotal: schema.sales.subtotal,
      taxTotal: schema.sales.taxTotal,
      total: schema.sales.total,
      paymentMethod: schema.sales.paymentMethod,
      status: schema.sales.status,
      notes: schema.sales.notes,
      createdAt: schema.sales.createdAt,
      customerName: schema.customers.name,
      userName: schema.users.name
    })
    .from(schema.sales)
    .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
    .leftJoin(schema.users, eq(schema.sales.userId, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.sales.createdAt))
    .all()
}

export function getSaleById(id: number) {
  const db = getDb()
  const sale = db
    .select({
      id: schema.sales.id,
      customerId: schema.sales.customerId,
      userId: schema.sales.userId,
      receiptNumber: schema.sales.receiptNumber,
      subtotal: schema.sales.subtotal,
      taxTotal: schema.sales.taxTotal,
      total: schema.sales.total,
      amountTendered: schema.sales.amountTendered,
      change: schema.sales.change,
      paymentMethod: schema.sales.paymentMethod,
      status: schema.sales.status,
      notes: schema.sales.notes,
      createdAt: schema.sales.createdAt,
      customerName: schema.customers.name,
      userName: schema.users.name
    })
    .from(schema.sales)
    .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
    .leftJoin(schema.users, eq(schema.sales.userId, schema.users.id))
    .where(eq(schema.sales.id, id))
    .get()

  if (!sale) return null

  const items = db.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, id)).all()
  return { ...sale, items }
}

export function cancelSale(data: { id: number }) {
  const db = getDb()
  const sale = db.select().from(schema.sales).where(eq(schema.sales.id, data.id)).get()
  if (!sale) throw new Error('Venta no encontrada')
  if (sale.status === 'anulada') throw new Error('La venta ya está anulada')

  getSqlite().transaction(() => {
    db.update(schema.sales)
      .set({ status: 'anulada' })
      .where(eq(schema.sales.id, data.id))
      .run()

    // Restore stock
    const items = db.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, data.id)).all()
    for (const item of items) {
      db.update(schema.products)
        .set({ stock: sql`stock + ${item.quantity}` })
        .where(eq(schema.products.id, item.productId))
        .run()
    }
  })()

  return { id: data.id, status: 'anulada' }
}

export function dailySummary(date?: string) {
  const sqlite = getSqlite()
  const targetDate = date ?? new Date().toISOString().slice(0, 10)
  const row = sqlite
    .prepare(
      `SELECT
        COUNT(*) as totalSales,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN payment_method = 'efectivo' THEN total ELSE 0 END), 0) as cashTotal,
        COALESCE(SUM(CASE WHEN payment_method = 'tarjeta' THEN total ELSE 0 END), 0) as cardTotal,
        COALESCE(SUM(CASE WHEN payment_method = 'transferencia' THEN total ELSE 0 END), 0) as transferTotal
      FROM sales
      WHERE status = 'completada' AND DATE(created_at) = ?`
    )
    .get(targetDate)
  return row
}

export function topProducts(limit = 10, from?: string, to?: string) {
  const sqlite = getSqlite()
  let query = `
    SELECT si.product_name as name, SUM(si.quantity) as totalQty, SUM(si.line_total) as totalRevenue
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'completada'
  `
  const params: string[] = []
  if (from) { query += ' AND DATE(s.created_at) >= ?'; params.push(from) }
  if (to) { query += ' AND DATE(s.created_at) <= ?'; params.push(to) }
  query += ' GROUP BY si.product_id ORDER BY totalRevenue DESC LIMIT ?'
  params.push(String(limit))

  return sqlite.prepare(query).all(...params)
}

function generateReceiptNumber(): string {
  const sqlite = getSqlite()
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const row = sqlite
    .prepare(`SELECT COUNT(*) + 1 AS seq FROM sales WHERE DATE(created_at) = DATE('now','localtime')`)
    .get() as { seq: number }
  return `R-${dateStr}-${String(row.seq).padStart(4, '0')}`
}
