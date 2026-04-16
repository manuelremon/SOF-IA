import { eq, sql, desc, and } from 'drizzle-orm'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

export function getDiscountSuggestions() {
  const db = getDb()

  // 1. Identificar productos con stock alto y baja rotación en los últimos 30 días
  const suggestions = db.select({
    id: schema.products.id,
    name: schema.products.name,
    brand: schema.products.brand,
    presentation: schema.products.presentation,
    barcode: schema.products.barcode,
    sku: schema.products.sku,
    stock: schema.products.stock,
    minStock: schema.products.minStock,
    salePrice: schema.products.salePrice,
    costPrice: schema.products.costPrice,
    lastSale: sql<string>`(SELECT max(created_at) FROM sales INNER JOIN sale_items ON sales.id = sale_items.sale_id WHERE sale_items.product_id = products.id)`
  })
  .from(schema.products)
  .where(
    and(
      eq(schema.products.isActive, true),
      sql`stock > min_stock * 2`, // Stock excesivo
      sql`(SELECT count(*) FROM sale_items INNER JOIN sales ON sales.id = sale_items.sale_id WHERE sale_items.product_id = products.id AND sales.created_at > date('now', '-30 days')) < 5` // Baja rotación
    )
  )
  .limit(5)
  .all()

  return suggestions.map(p => {
    const margin = p.salePrice - p.costPrice
    const suggestedDiscount = margin > 0 ? Math.min(margin * 0.4, p.salePrice * 0.15) : 0 // Descuento sugerido prudente
    const suggestedPrice = p.salePrice - suggestedDiscount
    const discountAmount = p.salePrice - suggestedPrice
    const discountPercentage = p.salePrice > 0 ? (discountAmount / p.salePrice) * 100 : 0
    return {
      ...p,
      suggestedDiscount,
      suggestedPrice,
      reason: 'Baja rotación con stock alto',
      discountAmount,
      discountPercentage: Math.round(discountPercentage)
    }
  }).filter(p => p.suggestedDiscount > 0)
}
