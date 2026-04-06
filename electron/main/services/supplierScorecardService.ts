import { getSqlite } from '../db/connection'

interface SupplierScore {
  supplierId: number
  supplierName: string
  punctuality: number
  fulfillment: number
  costStability: number
  composite: number
  totalPOs: number
}

export function getSupplierScorecard(supplierId: number): SupplierScore | null {
  const sqlite = getSqlite()

  const supplier = sqlite
    .prepare('SELECT id, name FROM suppliers WHERE id = ?')
    .get(supplierId) as { id: number; name: string } | undefined
  if (!supplier) return null

  const punctuality = computePunctualityScore(sqlite, supplierId)
  const fulfillment = computeFulfillmentScore(sqlite, supplierId)
  const costStability = computeCostStabilityScore(sqlite, supplierId)
  const totalPOs = (sqlite
    .prepare("SELECT COUNT(*) as c FROM purchase_orders WHERE supplier_id = ? AND status != 'cancelado'")
    .get(supplierId) as { c: number }).c

  const composite = Math.round(punctuality * 0.4 + fulfillment * 0.35 + costStability * 0.25)

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    punctuality,
    fulfillment,
    costStability,
    composite,
    totalPOs
  }
}

export function getSupplierRanking(): SupplierScore[] {
  const sqlite = getSqlite()
  const suppliers = sqlite
    .prepare('SELECT id FROM suppliers WHERE is_active = 1')
    .all() as Array<{ id: number }>

  const scores: SupplierScore[] = []
  for (const s of suppliers) {
    const score = getSupplierScorecard(s.id)
    if (score && score.totalPOs > 0) scores.push(score)
  }

  return scores.sort((a, b) => b.composite - a.composite)
}

function computePunctualityScore(sqlite: any, supplierId: number): number {
  const rows = sqlite
    .prepare(
      `SELECT po.id, po.expected_date,
              MIN(gr.created_at) as first_receipt_date
       FROM purchase_orders po
       LEFT JOIN goods_receipts gr ON gr.purchase_order_id = po.id
       WHERE po.supplier_id = ? AND po.status IN ('recibido','recibido_parcial')
         AND po.expected_date IS NOT NULL AND gr.created_at IS NOT NULL
       GROUP BY po.id`
    )
    .all(supplierId) as Array<{ id: number; expected_date: string; first_receipt_date: string }>

  if (rows.length === 0) return 100

  let totalDaysLate = 0
  for (const r of rows) {
    const expected = new Date(r.expected_date).getTime()
    const actual = new Date(r.first_receipt_date).getTime()
    const daysLate = Math.max(0, (actual - expected) / (1000 * 60 * 60 * 24))
    totalDaysLate += daysLate
  }

  const avgDaysLate = totalDaysLate / rows.length
  return Math.max(0, Math.round(100 - avgDaysLate * 10))
}

function computeFulfillmentScore(sqlite: any, supplierId: number): number {
  const row = sqlite
    .prepare(
      `SELECT COALESCE(SUM(poi.quantity_received), 0) as received,
              COALESCE(SUM(poi.quantity_ordered), 0) as ordered
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id
       WHERE po.supplier_id = ? AND po.status IN ('recibido','recibido_parcial')`
    )
    .get(supplierId) as { received: number; ordered: number }

  if (row.ordered === 0) return 100
  return Math.min(100, Math.round((row.received / row.ordered) * 100))
}

function computeCostStabilityScore(sqlite: any, supplierId: number): number {
  const products = sqlite
    .prepare(
      `SELECT poi.product_id, poi.unit_cost
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id
       WHERE po.supplier_id = ? AND po.status != 'cancelado'
       ORDER BY poi.product_id, po.created_at`
    )
    .all(supplierId) as Array<{ product_id: number; unit_cost: number }>

  if (products.length === 0) return 100

  const grouped: Record<number, number[]> = {}
  for (const p of products) {
    if (!grouped[p.product_id]) grouped[p.product_id] = []
    grouped[p.product_id].push(p.unit_cost)
  }

  const cvValues: number[] = []
  for (const costs of Object.values(grouped)) {
    if (costs.length < 2) continue
    const mean = costs.reduce((a, b) => a + b, 0) / costs.length
    if (mean === 0) continue
    const variance = costs.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / costs.length
    const stddev = Math.sqrt(variance)
    cvValues.push(stddev / mean)
  }

  if (cvValues.length === 0) return 100
  const avgCV = cvValues.reduce((a, b) => a + b, 0) / cvValues.length
  return Math.max(0, Math.round(100 - avgCV * 200))
}
