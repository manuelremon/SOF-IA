import { eq, and, sql } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export function listBySupplier(supplierId: number) {
  const sqlite = getSqlite()
  return sqlite.prepare(
    `SELECT sp.id, sp.supplier_id as supplierId, sp.product_id as productId,
            sp.supplier_code as supplierCode, sp.supplier_price as supplierPrice, sp.notes,
            p.name as productName, p.barcode, p.sku, p.sale_price as salePrice
     FROM supplier_products sp
     JOIN products p ON p.id = sp.product_id
     WHERE sp.supplier_id = ?
     ORDER BY p.name`
  ).all(supplierId)
}

export function listByProduct(productId: number) {
  const sqlite = getSqlite()
  return sqlite.prepare(
    `SELECT sp.id, sp.supplier_id as supplierId, sp.product_id as productId,
            sp.supplier_code as supplierCode, sp.supplier_price as supplierPrice,
            s.name as supplierName, s.cuit
     FROM supplier_products sp
     JOIN suppliers s ON s.id = sp.supplier_id
     WHERE sp.product_id = ? AND s.is_active = 1
     ORDER BY s.name`
  ).all(productId)
}

export function addProduct(data: {
  supplierId: number
  productId: number
  supplierCode?: string
  supplierPrice: number
  notes?: string
}) {
  const db = getDb()

  // Check if already exists
  const existing = db.select().from(schema.supplierProducts)
    .where(and(
      eq(schema.supplierProducts.supplierId, data.supplierId),
      eq(schema.supplierProducts.productId, data.productId)
    ))
    .get()

  if (existing) {
    // Update instead
    return db.update(schema.supplierProducts)
      .set({
        supplierCode: data.supplierCode ?? null,
        supplierPrice: data.supplierPrice,
        notes: data.notes ?? null,
        updatedAt: sql`(datetime('now','localtime'))`
      })
      .where(eq(schema.supplierProducts.id, existing.id))
      .returning()
      .get()
  }

  return db.insert(schema.supplierProducts)
    .values({
      supplierId: data.supplierId,
      productId: data.productId,
      supplierCode: data.supplierCode ?? null,
      supplierPrice: data.supplierPrice,
      notes: data.notes ?? null
    })
    .returning()
    .get()
}

export function removeProduct(supplierId: number, productId: number) {
  const db = getDb()
  db.delete(schema.supplierProducts)
    .where(and(
      eq(schema.supplierProducts.supplierId, supplierId),
      eq(schema.supplierProducts.productId, productId)
    ))
    .run()
  return { deleted: true }
}

export function importCatalog(supplierId: number, items: Array<{
  productId?: number
  barcode?: string
  sku?: string
  supplierCode?: string
  supplierPrice: number
}>) {
  const sqlite = getSqlite()
  const db = getDb()
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const item of items) {
    let productId = item.productId

    // Resolve product by barcode or sku if no productId
    if (!productId && item.barcode) {
      const p = sqlite.prepare('SELECT id FROM products WHERE barcode = ? AND is_active = 1').get(item.barcode) as { id: number } | undefined
      if (p) productId = p.id
    }
    if (!productId && item.sku) {
      const p = sqlite.prepare('SELECT id FROM products WHERE sku = ? AND is_active = 1').get(item.sku) as { id: number } | undefined
      if (p) productId = p.id
    }

    if (!productId) {
      skipped++
      errors.push(`Producto no encontrado: ${item.barcode || item.sku || 'sin código'}`)
      continue
    }

    try {
      addProduct({
        supplierId,
        productId,
        supplierCode: item.supplierCode,
        supplierPrice: item.supplierPrice
      })
      imported++
    } catch (err: any) {
      skipped++
      errors.push(err.message)
    }
  }

  return { imported, skipped, errors }
}

export function getCheapestSuppliers(productIds: number[]) {
  if (productIds.length === 0) return {}
  const sqlite = getSqlite()
  const placeholders = productIds.map(() => '?').join(',')
  const rows = sqlite.prepare(`
    SELECT sp.product_id as productId, sp.supplier_id as supplierId,
           s.name as supplierName, sp.supplier_price as supplierPrice
    FROM supplier_products sp
    JOIN suppliers s ON s.id = sp.supplier_id AND s.is_active = 1
    WHERE sp.product_id IN (${placeholders})
    ORDER BY sp.product_id, sp.supplier_price ASC
  `).all(...productIds) as Array<{
    productId: number; supplierId: number; supplierName: string; supplierPrice: number
  }>

  // Group by product, first entry is cheapest (ordered by price ASC)
  const result: Record<number, { supplierId: number; supplierName: string; supplierPrice: number }> = {}
  for (const row of rows) {
    if (!result[row.productId]) {
      result[row.productId] = { supplierId: row.supplierId, supplierName: row.supplierName, supplierPrice: row.supplierPrice }
    }
  }
  return result
}

export function getTemplateData() {
  const sqlite = getSqlite()
  const products = sqlite.prepare(
    'SELECT barcode, sku, name FROM products WHERE is_active = 1 ORDER BY name'
  ).all() as Array<{ barcode: string | null; sku: string | null; name: string }>

  return products.map((p) => ({
    codigo_barras: p.barcode || '',
    sku: p.sku || '',
    nombre_producto: p.name,
    codigo_proveedor: '',
    precio_proveedor: 0
  }))
}
