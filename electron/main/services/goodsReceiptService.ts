import { eq, desc, sql, asc } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

function generateReceiptNumber(): string {
  const sqlite = getSqlite()
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const row = sqlite
    .prepare(
      `SELECT COUNT(*) + 1 AS seq FROM goods_receipts WHERE DATE(created_at) = DATE('now','localtime')`
    )
    .get() as { seq: number }
  return `REC-${dateStr}-${String(row.seq).padStart(4, '0')}`
}

export function receiveGoods(data: {
  purchaseOrderId: number
  userId?: number
  notes?: string
  items: Array<{
    purchaseOrderItemId: number
    productId: number
    quantityReceived: number
  }>
}) {
  const db = getDb()

  // Validate PO exists and is in a receivable status
  const po = db
    .select()
    .from(schema.purchaseOrders)
    .where(eq(schema.purchaseOrders.id, data.purchaseOrderId))
    .get()
  if (!po) throw new Error('Orden de compra no encontrada')
  if (!['enviado', 'recibido_parcial'].includes(po.status)) {
    throw new Error('Solo se puede recibir mercadería de órdenes enviadas o parcialmente recibidas')
  }

  // Validate quantities
  for (const item of data.items) {
    if (item.quantityReceived <= 0) continue
    const poItem = db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.id, item.purchaseOrderItemId))
      .get()
    if (!poItem) throw new Error(`Item de OC #${item.purchaseOrderItemId} no encontrado`)
    const remaining = poItem.quantityOrdered - poItem.quantityReceived
    if (item.quantityReceived > remaining) {
      throw new Error(
        `No se puede recibir ${item.quantityReceived} de "${poItem.productName}". Pendiente: ${remaining}`
      )
    }
  }

  const receiptNumber = generateReceiptNumber()
  const itemsToReceive = data.items.filter((i) => i.quantityReceived > 0)
  if (itemsToReceive.length === 0) {
    throw new Error('Debe recibir al menos un item con cantidad mayor a 0')
  }

  const result = getSqlite().transaction(() => {
    // Create receipt
    const receipt = db
      .insert(schema.goodsReceipts)
      .values({
        purchaseOrderId: data.purchaseOrderId,
        userId: data.userId ?? null,
        receiptNumber,
        notes: data.notes ?? null
      })
      .returning()
      .get()

    // Process each item
    for (const item of itemsToReceive) {
      // Create receipt item
      db.insert(schema.goodsReceiptItems)
        .values({
          goodsReceiptId: receipt.id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          productId: item.productId,
          quantityReceived: item.quantityReceived
        })
        .run()

      // Update PO item quantity_received
      db.update(schema.purchaseOrderItems)
        .set({
          quantityReceived: sql`quantity_received + ${item.quantityReceived}`
        })
        .where(eq(schema.purchaseOrderItems.id, item.purchaseOrderItemId))
        .run()

      // Increment product stock
      db.update(schema.products)
        .set({
          stock: sql`stock + ${item.quantityReceived}`,
          updatedAt: sql`(datetime('now','localtime'))`
        })
        .where(eq(schema.products.id, item.productId))
        .run()
    }

    // Determine new PO status
    const allItems = db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.purchaseOrderId, data.purchaseOrderId))
      .all()

    const allReceived = allItems.every((i) => i.quantityReceived >= i.quantityOrdered)
    const newStatus = allReceived ? 'recibido' : 'recibido_parcial'

    db.update(schema.purchaseOrders)
      .set({
        status: newStatus,
        updatedAt: sql`(datetime('now','localtime'))`
      })
      .where(eq(schema.purchaseOrders.id, data.purchaseOrderId))
      .run()

    return { ...receipt, poStatus: newStatus }
  })()

  return result
}

export function listGoodsReceipts(filters?: { purchaseOrderId?: number }) {
  const db = getDb()
  const conditions = []
  if (filters?.purchaseOrderId) {
    conditions.push(eq(schema.goodsReceipts.purchaseOrderId, filters.purchaseOrderId))
  }

  const baseQuery = db
    .select({
      id: schema.goodsReceipts.id,
      purchaseOrderId: schema.goodsReceipts.purchaseOrderId,
      userId: schema.goodsReceipts.userId,
      receiptNumber: schema.goodsReceipts.receiptNumber,
      notes: schema.goodsReceipts.notes,
      createdAt: schema.goodsReceipts.createdAt,
      orderNumber: schema.purchaseOrders.orderNumber,
      supplierName: schema.suppliers.name,
      userName: schema.users.name
    })
    .from(schema.goodsReceipts)
    .leftJoin(
      schema.purchaseOrders,
      eq(schema.goodsReceipts.purchaseOrderId, schema.purchaseOrders.id)
    )
    .leftJoin(
      schema.suppliers,
      eq(schema.purchaseOrders.supplierId, schema.suppliers.id)
    )
    .leftJoin(schema.users, eq(schema.goodsReceipts.userId, schema.users.id))

  if (conditions.length > 0) {
    return baseQuery.where(conditions[0]).orderBy(desc(schema.goodsReceipts.createdAt)).all()
  }
  return baseQuery.orderBy(desc(schema.goodsReceipts.createdAt)).all()
}

export function getGoodsReceiptById(id: number) {
  const db = getDb()
  const receipt = db
    .select({
      id: schema.goodsReceipts.id,
      purchaseOrderId: schema.goodsReceipts.purchaseOrderId,
      userId: schema.goodsReceipts.userId,
      receiptNumber: schema.goodsReceipts.receiptNumber,
      notes: schema.goodsReceipts.notes,
      createdAt: schema.goodsReceipts.createdAt,
      orderNumber: schema.purchaseOrders.orderNumber,
      supplierName: schema.suppliers.name,
      userName: schema.users.name
    })
    .from(schema.goodsReceipts)
    .leftJoin(
      schema.purchaseOrders,
      eq(schema.goodsReceipts.purchaseOrderId, schema.purchaseOrders.id)
    )
    .leftJoin(
      schema.suppliers,
      eq(schema.purchaseOrders.supplierId, schema.suppliers.id)
    )
    .leftJoin(schema.users, eq(schema.goodsReceipts.userId, schema.users.id))
    .where(eq(schema.goodsReceipts.id, id))
    .get()

  if (!receipt) return null

  const items = db
    .select({
      id: schema.goodsReceiptItems.id,
      goodsReceiptId: schema.goodsReceiptItems.goodsReceiptId,
      purchaseOrderItemId: schema.goodsReceiptItems.purchaseOrderItemId,
      productId: schema.goodsReceiptItems.productId,
      quantityReceived: schema.goodsReceiptItems.quantityReceived,
      productName: schema.purchaseOrderItems.productName
    })
    .from(schema.goodsReceiptItems)
    .leftJoin(
      schema.purchaseOrderItems,
      eq(schema.goodsReceiptItems.purchaseOrderItemId, schema.purchaseOrderItems.id)
    )
    .where(eq(schema.goodsReceiptItems.goodsReceiptId, id))
    .orderBy(asc(schema.goodsReceiptItems.id))
    .all()

  return { ...receipt, items }
}
