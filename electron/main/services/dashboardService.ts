import { getSqlite } from '../db/connection'

export function getKpis() {
  const sqlite = getSqlite()

  const today = new Date().toISOString().slice(0, 10)

  const salesToday = sqlite
    .prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
       FROM sales WHERE status = 'completada' AND DATE(created_at) = ?`
    )
    .get(today) as { count: number; revenue: number }

  const salesMonth = sqlite
    .prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
       FROM sales WHERE status = 'completada' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')`
    )
    .get() as { count: number; revenue: number }

  const productsCount = sqlite
    .prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1')
    .get() as { count: number }

  const lowStock = sqlite
    .prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND stock <= min_stock')
    .get() as { count: number }

  const customersCount = sqlite
    .prepare('SELECT COUNT(*) as count FROM customers WHERE is_active = 1')
    .get() as { count: number }

  return {
    ventasHoy: salesToday.count,
    ingresoHoy: salesToday.revenue,
    ventasMes: salesMonth.count,
    ingresoMes: salesMonth.revenue,
    productos: productsCount.count,
    stockBajo: lowStock.count,
    clientes: customersCount.count
  }
}

export function getSalesChart(days = 7) {
  const sqlite = getSqlite()
  const rows = sqlite
    .prepare(
      `SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as total, COUNT(*) as count
       FROM sales
       WHERE status = 'completada' AND DATE(created_at) >= DATE('now', 'localtime', ?)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    )
    .all(`-${days} days`) as Array<{ date: string; total: number; count: number }>
  return rows
}

export function getTopProducts(limit = 5) {
  const sqlite = getSqlite()
  return sqlite
    .prepare(
      `SELECT si.product_name as name, SUM(si.quantity) as qty, SUM(si.line_total) as revenue
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completada' AND DATE(s.created_at) >= DATE('now', 'localtime', '-30 days')
       GROUP BY si.product_id
       ORDER BY revenue DESC
       LIMIT ?`
    )
    .all(limit)
}

export function getRecentSales(limit = 10) {
  const sqlite = getSqlite()
  return sqlite
    .prepare(
      `SELECT s.id, s.receipt_number as receiptNumber, s.total, s.payment_method as paymentMethod,
              s.created_at as createdAt, COALESCE(c.name, '') as customerName
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.status = 'completada'
       ORDER BY s.created_at DESC
       LIMIT ?`
    )
    .all(limit)
}
