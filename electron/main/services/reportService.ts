import { getSqlite } from '../db/connection'

export function salesByPeriod(from: string, to: string, groupBy: 'day' | 'week' | 'month' = 'day') {
  const sqlite = getSqlite()
  const dateFormat = groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-W%W' : '%Y-%m-%d'
  return sqlite.prepare(`
    SELECT
      strftime('${dateFormat}', created_at) as period,
      COUNT(*) as count,
      COALESCE(SUM(total), 0) as total,
      COALESCE(SUM(discount_total), 0) as discountTotal,
      COALESCE(SUM(tax_total), 0) as taxTotal
    FROM sales
    WHERE status = 'completada'
      AND DATE(created_at) >= ? AND DATE(created_at) <= ?
    GROUP BY period
    ORDER BY period
  `).all(from, to)
}

export function salesByProduct(from: string, to: string) {
  const sqlite = getSqlite()
  return sqlite.prepare(`
    SELECT
      si.product_name as productName,
      SUM(si.quantity) as totalQty,
      SUM(si.line_total) as totalRevenue,
      SUM(si.discount_total) as totalDiscount
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'completada'
      AND DATE(s.created_at) >= ? AND DATE(s.created_at) <= ?
    GROUP BY si.product_id
    ORDER BY totalRevenue DESC
  `).all(from, to)
}

export function salesByPaymentMethod(from: string, to: string) {
  const sqlite = getSqlite()
  return sqlite.prepare(`
    SELECT
      payment_method as method,
      COUNT(*) as count,
      COALESCE(SUM(total), 0) as total
    FROM sales
    WHERE status = 'completada'
      AND DATE(created_at) >= ? AND DATE(created_at) <= ?
    GROUP BY payment_method
    ORDER BY total DESC
  `).all(from, to)
}

export function salesByCustomer(from: string, to: string) {
  const sqlite = getSqlite()
  return sqlite.prepare(`
    SELECT
      COALESCE(c.name, 'Consumidor final') as customerName,
      COUNT(*) as count,
      COALESCE(SUM(s.total), 0) as total
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    WHERE s.status = 'completada'
      AND DATE(s.created_at) >= ? AND DATE(s.created_at) <= ?
    GROUP BY s.customer_id
    ORDER BY total DESC
  `).all(from, to)
}

export function profitReport(from: string, to: string) {
  const sqlite = getSqlite()
  return sqlite.prepare(`
    SELECT
      SUM(si.line_total) as revenue,
      SUM(si.quantity * p.cost_price) as cost,
      SUM(si.line_total) - SUM(si.quantity * p.cost_price) as profit,
      CASE WHEN SUM(si.line_total) > 0
        THEN ROUND((SUM(si.line_total) - SUM(si.quantity * p.cost_price)) * 100.0 / SUM(si.line_total), 1)
        ELSE 0
      END as marginPercent
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.status = 'completada'
      AND DATE(s.created_at) >= ? AND DATE(s.created_at) <= ?
  `).get(from, to)
}
