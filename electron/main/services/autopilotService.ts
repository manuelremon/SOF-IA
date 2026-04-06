import { getSqlite } from '../db/connection'
import { createPurchaseOrder } from './purchaseOrderService'

interface ReorderCandidate {
  productId: number
  productName: string
  currentStock: number
  avgDailySales: number
  daysUntilStockout: number
  suggestedQty: number
  lastSupplierId: number | null
  lastSupplierName: string | null
  lastUnitCost: number | null
}

interface DraftPOPreview {
  supplierId: number
  supplierName: string
  items: Array<{
    productId: number
    productName: string
    suggestedQty: number
    lastUnitCost: number
  }>
  estimatedTotal: number
}

export function previewAutoPOs(coverageDays = 30): DraftPOPreview[] {
  const candidates = computeReorderCandidates(coverageDays)
  return groupBySUpplier(candidates)
}

export function generateAutoPOs(userId: number | null, coverageDays = 30): number[] {
  const previews = previewAutoPOs(coverageDays)
  const createdIds: number[] = []

  for (const preview of previews) {
    if (preview.supplierId <= 0) continue

    const po = createPurchaseOrder({
      supplierId: preview.supplierId,
      userId: userId ?? undefined,
      expectedDate: getExpectedDate(14),
      notes: 'Generado automáticamente por Piloto Automático',
      items: preview.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantityOrdered: i.suggestedQty,
        unitCost: i.lastUnitCost
      }))
    })

    createdIds.push(po.id)
  }

  return createdIds
}

function computeReorderCandidates(coverageDays: number): ReorderCandidate[] {
  const sqlite = getSqlite()

  const rows = sqlite
    .prepare(
      `SELECT p.id as productId, p.name as productName, p.stock as currentStock,
              COALESCE(SUM(si.quantity), 0) / 60.0 as avgDailySales
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id
       LEFT JOIN sales s ON s.id = si.sale_id
         AND s.status = 'completada'
         AND DATE(s.created_at) >= DATE('now','localtime','-60 days')
       WHERE p.is_active = 1 AND p.stock >= 0
       GROUP BY p.id
       HAVING avgDailySales > 0 AND (p.stock / avgDailySales) < ?`
    )
    .all(coverageDays) as Array<{
    productId: number; productName: string; currentStock: number; avgDailySales: number
  }>

  return rows.map((r) => {
    const supplier = resolveSupplierForProduct(sqlite, r.productId)
    const daysUntilStockout = r.avgDailySales > 0 ? r.currentStock / r.avgDailySales : 999
    const suggestedQty = Math.ceil(r.avgDailySales * coverageDays - r.currentStock)

    return {
      ...r,
      daysUntilStockout: Math.round(daysUntilStockout),
      suggestedQty: Math.max(1, suggestedQty),
      lastSupplierId: supplier?.supplierId ?? null,
      lastSupplierName: supplier?.supplierName ?? null,
      lastUnitCost: supplier?.unitCost ?? null
    }
  })
}

function resolveSupplierForProduct(sqlite: any, productId: number): {
  supplierId: number; supplierName: string; unitCost: number
} | null {
  const row = sqlite
    .prepare(
      `SELECT po.supplier_id as supplierId, sup.name as supplierName, poi.unit_cost as unitCost
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id
       JOIN suppliers sup ON sup.id = po.supplier_id
       WHERE poi.product_id = ? AND po.status != 'cancelado'
       ORDER BY po.created_at DESC LIMIT 1`
    )
    .get(productId) as { supplierId: number; supplierName: string; unitCost: number } | undefined

  return row ?? null
}

function groupBySUpplier(candidates: ReorderCandidate[]): DraftPOPreview[] {
  const groups: Record<number, DraftPOPreview> = {}

  for (const c of candidates) {
    if (!c.lastSupplierId || !c.lastUnitCost) continue

    if (!groups[c.lastSupplierId]) {
      groups[c.lastSupplierId] = {
        supplierId: c.lastSupplierId,
        supplierName: c.lastSupplierName ?? 'Desconocido',
        items: [],
        estimatedTotal: 0
      }
    }

    groups[c.lastSupplierId].items.push({
      productId: c.productId,
      productName: c.productName,
      suggestedQty: c.suggestedQty,
      lastUnitCost: c.lastUnitCost
    })
    groups[c.lastSupplierId].estimatedTotal += c.suggestedQty * c.lastUnitCost
  }

  return Object.values(groups)
}

function getExpectedDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}
