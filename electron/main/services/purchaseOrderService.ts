import { eq, and, desc, sql, gte, lte, like } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateOrderNumber(): string {
  const sqlite = getSqlite()
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const row = sqlite
    .prepare(`SELECT COUNT(*) + 1 AS seq FROM purchase_orders WHERE DATE(created_at) = DATE('now','localtime')`)
    .get() as { seq: number }
  return `OC-${dateStr}-${String(row.seq).padStart(4, '0')}`
}

/* ------------------------------------------------------------------ */
/*  List                                                               */
/* ------------------------------------------------------------------ */

export function listPurchaseOrders(filters?: {
  status?: string
  supplierId?: number
  from?: string
  to?: string
  search?: string
}) {
  const db = getDb()
  const conditions = []
  if (filters?.status) conditions.push(eq(schema.purchaseOrders.status, filters.status))
  if (filters?.supplierId) conditions.push(eq(schema.purchaseOrders.supplierId, filters.supplierId))
  if (filters?.from) conditions.push(gte(schema.purchaseOrders.orderDate, filters.from))
  if (filters?.to) conditions.push(lte(schema.purchaseOrders.orderDate, filters.to))
  if (filters?.search) conditions.push(like(schema.purchaseOrders.orderNumber, `%${filters.search}%`))
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select({
      id: schema.purchaseOrders.id,
      supplierId: schema.purchaseOrders.supplierId,
      userId: schema.purchaseOrders.userId,
      orderNumber: schema.purchaseOrders.orderNumber,
      status: schema.purchaseOrders.status,
      orderDate: schema.purchaseOrders.orderDate,
      expectedDate: schema.purchaseOrders.expectedDate,
      subtotal: schema.purchaseOrders.subtotal,
      notes: schema.purchaseOrders.notes,
      createdAt: schema.purchaseOrders.createdAt,
      updatedAt: schema.purchaseOrders.updatedAt,
      supplierName: schema.suppliers.name
    })
    .from(schema.purchaseOrders)
    .leftJoin(schema.suppliers, eq(schema.purchaseOrders.supplierId, schema.suppliers.id))
    .where(whereClause)
    .orderBy(desc(schema.purchaseOrders.createdAt))
    .all()
}

/* ------------------------------------------------------------------ */
/*  Get by ID                                                          */
/* ------------------------------------------------------------------ */

export function getPurchaseOrderById(id: number) {
  const db = getDb()
  const po = db
    .select({
      id: schema.purchaseOrders.id,
      supplierId: schema.purchaseOrders.supplierId,
      userId: schema.purchaseOrders.userId,
      orderNumber: schema.purchaseOrders.orderNumber,
      status: schema.purchaseOrders.status,
      orderDate: schema.purchaseOrders.orderDate,
      expectedDate: schema.purchaseOrders.expectedDate,
      subtotal: schema.purchaseOrders.subtotal,
      notes: schema.purchaseOrders.notes,
      createdAt: schema.purchaseOrders.createdAt,
      updatedAt: schema.purchaseOrders.updatedAt,
      supplierName: schema.suppliers.name,
      userName: schema.users.name
    })
    .from(schema.purchaseOrders)
    .leftJoin(schema.suppliers, eq(schema.purchaseOrders.supplierId, schema.suppliers.id))
    .leftJoin(schema.users, eq(schema.purchaseOrders.userId, schema.users.id))
    .where(eq(schema.purchaseOrders.id, id))
    .get()

  if (!po) return null

  const items = db
    .select()
    .from(schema.purchaseOrderItems)
    .where(eq(schema.purchaseOrderItems.purchaseOrderId, id))
    .all()

  // Get receipts for this PO
  const receipts = db
    .select({
      id: schema.goodsReceipts.id,
      receiptNumber: schema.goodsReceipts.receiptNumber,
      notes: schema.goodsReceipts.notes,
      createdAt: schema.goodsReceipts.createdAt,
      userName: schema.users.name
    })
    .from(schema.goodsReceipts)
    .leftJoin(schema.users, eq(schema.goodsReceipts.userId, schema.users.id))
    .where(eq(schema.goodsReceipts.purchaseOrderId, id))
    .orderBy(desc(schema.goodsReceipts.createdAt))
    .all()

  return { ...po, items, receipts }
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export function createPurchaseOrder(data: {
  supplierId: number
  userId?: number
  orderDate?: string
  expectedDate?: string
  notes?: string
  items: Array<{
    productId: number
    productName: string
    quantityOrdered: number
    unitCost: number
  }>
}) {
  const db = getDb()
  const orderNumber = generateOrderNumber()

  let subtotal = 0
  const computedItems = data.items.map((item) => {
    const lineTotal = item.quantityOrdered * item.unitCost
    subtotal += lineTotal
    return { ...item, lineTotal }
  })

  const result = getSqlite().transaction(() => {
    const po = db
      .insert(schema.purchaseOrders)
      .values({
        supplierId: data.supplierId,
        userId: data.userId ?? null,
        orderNumber,
        status: 'borrador',
        ...(data.orderDate ? { orderDate: data.orderDate } : {}),
        expectedDate: data.expectedDate ?? null,
        subtotal,
        notes: data.notes ?? null
      })
      .returning()
      .get()

    const items = computedItems.map((item) =>
      db
        .insert(schema.purchaseOrderItems)
        .values({
          purchaseOrderId: po.id,
          productId: item.productId,
          productName: item.productName,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: 0,
          unitCost: item.unitCost,
          lineTotal: item.lineTotal
        })
        .returning()
        .get()
    )

    return { ...po, items }
  })()

  return result
}

/* ------------------------------------------------------------------ */
/*  Update (only for borrador status)                                  */
/* ------------------------------------------------------------------ */

export function updatePurchaseOrder(data: {
  id: number
  supplierId?: number
  orderDate?: string
  expectedDate?: string | null
  notes?: string | null
  items?: Array<{
    productId: number
    productName: string
    quantityOrdered: number
    unitCost: number
  }>
}) {
  const db = getDb()
  const po = db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, data.id)).get()
  if (!po) throw new Error('Orden de compra no encontrada')
  if (po.status !== 'borrador') throw new Error('Solo se pueden editar órdenes en estado borrador')

  const result = getSqlite().transaction(() => {
    const setValues: Record<string, unknown> = { updatedAt: sql`(datetime('now','localtime'))` }
    if (data.supplierId !== undefined) setValues.supplierId = data.supplierId
    if (data.orderDate !== undefined) setValues.orderDate = data.orderDate
    if (data.expectedDate !== undefined) setValues.expectedDate = data.expectedDate
    if (data.notes !== undefined) setValues.notes = data.notes

    if (data.items) {
      // Recalculate subtotal
      let subtotal = 0
      const computedItems = data.items.map((item) => {
        const lineTotal = item.quantityOrdered * item.unitCost
        subtotal += lineTotal
        return { ...item, lineTotal }
      })
      setValues.subtotal = subtotal

      // Delete old items and insert new ones
      db.delete(schema.purchaseOrderItems)
        .where(eq(schema.purchaseOrderItems.purchaseOrderId, data.id))
        .run()

      for (const item of computedItems) {
        db.insert(schema.purchaseOrderItems)
          .values({
            purchaseOrderId: data.id,
            productId: item.productId,
            productName: item.productName,
            quantityOrdered: item.quantityOrdered,
            quantityReceived: 0,
            unitCost: item.unitCost,
            lineTotal: item.lineTotal
          })
          .run()
      }
    }

    return db
      .update(schema.purchaseOrders)
      .set(setValues)
      .where(eq(schema.purchaseOrders.id, data.id))
      .returning()
      .get()
  })()

  return result
}

/* ------------------------------------------------------------------ */
/*  Update Status                                                      */
/* ------------------------------------------------------------------ */

export function updatePurchaseOrderStatus(data: { id: number; status: string }) {
  const db = getDb()
  const po = db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, data.id)).get()
  if (!po) throw new Error('Orden de compra no encontrada')

  // Validate transitions
  const validTransitions: Record<string, string[]> = {
    borrador: ['enviado', 'cancelado'],
    enviado: ['recibido_parcial', 'recibido', 'cancelado'],
    recibido_parcial: ['recibido']
  }

  const allowed = validTransitions[po.status] || []
  if (!allowed.includes(data.status)) {
    throw new Error(`No se puede cambiar de "${po.status}" a "${data.status}"`)
  }

  return db
    .update(schema.purchaseOrders)
    .set({ status: data.status, updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.purchaseOrders.id, data.id))
    .returning()
    .get()
}

/* ------------------------------------------------------------------ */
/*  Cancel                                                             */
/* ------------------------------------------------------------------ */

export function cancelPurchaseOrder(id: number) {
  const db = getDb()
  const po = db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, id)).get()
  if (!po) throw new Error('Orden de compra no encontrada')
  if (po.status === 'recibido' || po.status === 'recibido_parcial') {
    throw new Error('No se puede cancelar una orden que ya tiene recepciones')
  }
  if (po.status === 'cancelado') throw new Error('La orden ya está cancelada')

  return db
    .update(schema.purchaseOrders)
    .set({ status: 'cancelado', updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.purchaseOrders.id, id))
    .returning()
    .get()
}
