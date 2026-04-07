import { eq, like, and, or, asc, sql, desc } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

/* -- Categories ---------------------------------------------------- */

export function listCategories() {
  const db = getDb()
  return db.select().from(schema.categories).orderBy(asc(schema.categories.name)).all()
}

export function createCategory(data: { name: string; color?: string }) {
  const db = getDb()
  return db
    .insert(schema.categories)
    .values({ name: data.name, color: data.color ?? null })
    .returning()
    .get()
}

export function updateCategory(data: { id: number; name?: string; color?: string; isActive?: boolean }) {
  const db = getDb()
  const { id, ...fields } = data
  const setValues: Record<string, unknown> = {}
  if (fields.name !== undefined) setValues.name = fields.name
  if (fields.color !== undefined) setValues.color = fields.color
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive
  return db.update(schema.categories).set(setValues).where(eq(schema.categories.id, id)).returning().get()
}

export function deleteCategory(id: number) {
  const db = getDb()
  db.update(schema.categories)
    .set({ isActive: false })
    .where(eq(schema.categories.id, id))
    .run()
  return { deleted: true }
}

/* -- Products ------------------------------------------------------ */

export function listProducts(filters?: { categoryId?: number; search?: string; isActive?: boolean }) {
  const db = getDb()
  const conditions: any[] = []
  if (filters?.categoryId !== undefined) conditions.push(eq(schema.products.categoryId, filters.categoryId))
  if (filters?.search) conditions.push(like(schema.products.name, `%${filters.search}%`))
  if (filters?.isActive !== undefined) conditions.push(eq(schema.products.isActive, filters.isActive))
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select({
      id: schema.products.id,
      categoryId: schema.products.categoryId,
      name: schema.products.name,
      description: schema.products.description,
      brand: schema.products.brand,
      presentation: schema.products.presentation,
      barcode: schema.products.barcode,
      sku: schema.products.sku,
      costPrice: schema.products.costPrice,
      salePrice: schema.products.salePrice,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      unit: schema.products.unit,
      imagePath: schema.products.imagePath,
      isActive: schema.products.isActive,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(whereClause)
    .orderBy(asc(schema.products.name))
    .all()
}

export function getProductById(id: number) {
  const db = getDb()
  const row = db
    .select({
      id: schema.products.id,
      categoryId: schema.products.categoryId,
      name: schema.products.name,
      description: schema.products.description,
      brand: schema.products.brand,
      presentation: schema.products.presentation,
      barcode: schema.products.barcode,
      sku: schema.products.sku,
      costPrice: schema.products.costPrice,
      salePrice: schema.products.salePrice,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      unit: schema.products.unit,
      imagePath: schema.products.imagePath,
      isActive: schema.products.isActive,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(eq(schema.products.id, id))
    .get()
  return row ?? null
}

export function createProduct(data: {
  name: string
  categoryId?: number
  description?: string
  brand?: string
  presentation?: string
  barcode?: string
  sku?: string
  costPrice?: number
  salePrice?: number
  stock?: number
  minStock?: number
  unit?: string
  imagePath?: string | null
}) {
  const db = getDb()
  return db
    .insert(schema.products)
    .values({
      name: data.name,
      categoryId: data.categoryId ?? null,
      description: data.description ?? null,
      brand: data.brand ?? null,
      presentation: data.presentation ?? null,
      barcode: data.barcode ?? null,
      sku: data.sku ?? null,
      costPrice: data.costPrice ?? 0,
      salePrice: data.salePrice ?? 0,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0,
      unit: data.unit ?? 'unidad',
      imagePath: data.imagePath ?? null
    })
    .returning()
    .get()
}

export function updateProduct(data: {
  id: number
  name?: string
  categoryId?: number | null
  description?: string | null
  brand?: string | null
  presentation?: string | null
  barcode?: string | null
  sku?: string | null
  costPrice?: number
  salePrice?: number
  stock?: number
  minStock?: number
  unit?: string
  imagePath?: string | null
  isActive?: boolean
}) {
  const db = getDb()
  const { id, ...fields } = data
  const setValues: Record<string, unknown> = { updatedAt: sql`(datetime('now','localtime'))` }

  if (fields.name !== undefined) setValues.name = fields.name
  if (fields.categoryId !== undefined) setValues.categoryId = fields.categoryId
  if (fields.description !== undefined) setValues.description = fields.description
  if (fields.brand !== undefined) setValues.brand = fields.brand
  if (fields.presentation !== undefined) setValues.presentation = fields.presentation
  if (fields.barcode !== undefined) setValues.barcode = fields.barcode
  if (fields.sku !== undefined) setValues.sku = fields.sku
  if (fields.costPrice !== undefined) setValues.costPrice = fields.costPrice
  if (fields.salePrice !== undefined) setValues.salePrice = fields.salePrice
  if (fields.stock !== undefined) setValues.stock = fields.stock
  if (fields.minStock !== undefined) setValues.minStock = fields.minStock
  if (fields.unit !== undefined) setValues.unit = fields.unit
  if (fields.imagePath !== undefined) setValues.imagePath = fields.imagePath
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive

  return db.update(schema.products).set(setValues).where(eq(schema.products.id, id)).returning().get()
}

export function deleteProduct(id: number) {
  const db = getDb()
  db.update(schema.products)
    .set({ isActive: false, updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.products.id, id))
    .run()
  return { deleted: true }
}

export function searchProducts(query: string) {
  const db = getDb()
  const pattern = `%${query}%`
  return db
    .select({
      id: schema.products.id,
      categoryId: schema.products.categoryId,
      name: schema.products.name,
      brand: schema.products.brand,
      presentation: schema.products.presentation,
      barcode: schema.products.barcode,
      sku: schema.products.sku,
      costPrice: schema.products.costPrice,
      salePrice: schema.products.salePrice,
      stock: schema.products.stock,
      unit: schema.products.unit,
      imagePath: schema.products.imagePath,
      isActive: schema.products.isActive,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(
      and(
        eq(schema.products.isActive, true),
        or(
          like(schema.products.name, pattern),
          like(schema.products.brand, pattern),
          like(schema.products.presentation, pattern),
          like(schema.products.barcode, pattern),
          like(schema.products.sku, pattern)
        )
      )
    )
    .limit(50)
    .all()
}

export function adjustStock(data: { id: number; adjustment: number; reason?: string }) {
  const db = getDb()
  const result = getSqlite().transaction(() => {
    return db
      .update(schema.products)
      .set({
        stock: sql`stock + ${data.adjustment}`,
        updatedAt: sql`(datetime('now','localtime'))`
      })
      .where(eq(schema.products.id, data.id))
      .returning()
      .get()
  })()
  return result
}

export function lowStockProducts() {
  const db = getDb()
  return db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(and(eq(schema.products.isActive, true), sql`${schema.products.stock} <= ${schema.products.minStock}`))
    .orderBy(asc(schema.products.stock))
    .all()
}

/* -- Bulk Price Update ------------------------------------------------ */

export function bulkPricePreview(filters: {
  categoryId?: number
  all?: boolean
}, adjustment: {
  type: 'porcentaje' | 'monto'
  value: number
  target: 'salePrice' | 'costPrice' | 'both'
}) {
  const db = getDb()
  const conditions = [eq(schema.products.isActive, true)]
  if (filters.categoryId) conditions.push(eq(schema.products.categoryId, filters.categoryId))

  const products = db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      costPrice: schema.products.costPrice,
      salePrice: schema.products.salePrice,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(and(...conditions))
    .orderBy(asc(schema.products.name))
    .all()

  return products.map((p) => {
    const newCostPrice = (adjustment.target === 'costPrice' || adjustment.target === 'both')
      ? applyAdjustment(p.costPrice, adjustment.type, adjustment.value)
      : p.costPrice
    const newSalePrice = (adjustment.target === 'salePrice' || adjustment.target === 'both')
      ? applyAdjustment(p.salePrice, adjustment.type, adjustment.value)
      : p.salePrice

    return {
      id: p.id,
      name: p.name,
      categoryName: p.categoryName,
      currentCostPrice: p.costPrice,
      currentSalePrice: p.salePrice,
      newCostPrice: Math.round(newCostPrice * 100) / 100,
      newSalePrice: Math.round(newSalePrice * 100) / 100
    }
  })
}

export function bulkPriceApply(productUpdates: Array<{
  id: number
  newCostPrice: number
  newSalePrice: number
}>) {
  const db = getDb()
  return getSqlite().transaction(() => {
    for (const p of productUpdates) {
      db.update(schema.products)
        .set({
          costPrice: p.newCostPrice,
          salePrice: p.newSalePrice,
          updatedAt: sql`(datetime('now','localtime'))`
        })
        .where(eq(schema.products.id, p.id))
        .run()
    }
    return { updated: productUpdates.length }
  })()
}

function applyAdjustment(currentPrice: number, type: 'porcentaje' | 'monto', value: number): number {
  if (type === 'porcentaje') {
    return currentPrice * (1 + value / 100)
  }
  return currentPrice + value
}
