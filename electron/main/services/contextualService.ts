import { eq, sql, desc, and } from 'drizzle-orm'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

export function getSuggestionsForCurrentTime(limit = 8) {
  const db = getDb()
  
  // Obtenemos la hora actual (formato 00-23)
  // En SQLite, strftime('%H', 'now', 'localtime')
  
  const suggestions = db
    .select({
      productId: schema.saleItems.productId,
      productName: schema.saleItems.productName,
      barcode: schema.products.barcode,
      salePrice: schema.products.salePrice,
      stock: schema.products.stock,
      totalSold: sql<number>`sum(${schema.saleItems.quantity})`.as('total_sold')
    })
    .from(schema.saleItems)
    .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
    .innerJoin(schema.products, eq(schema.saleItems.productId, schema.products.id))
    .where(
      and(
        eq(schema.products.isActive, true),
        sql`strftime('%H', ${schema.sales.createdAt}) BETWEEN strftime('%H', 'now', 'localtime', '-2 hours') AND strftime('%H', 'now', 'localtime', '+2 hours')`
      )
    )
    .groupBy(schema.saleItems.productId)
    .orderBy(desc(sql`total_sold`))
    .limit(limit)
    .all()

  return suggestions
}
