import { getSqlite } from '../db/connection'

export interface PulseAlert {
  type: 'sales' | 'margin' | 'cash' | 'stock'
  severity: 'warning' | 'danger' | 'info'
  message: string
  actionLabel: string
  actionRoute: string
}

export function getAlerts(): PulseAlert[] {
  const alerts: PulseAlert[] = []
  const sqlite = getSqlite()

  alerts.push(...detectSalesAnomaly(sqlite))
  alerts.push(...detectMarginErosion(sqlite))
  alerts.push(...detectCashDiscrepancies(sqlite))
  alerts.push(...detectStockVelocityRisk(sqlite))

  return alerts.sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })
}

function detectSalesAnomaly(sqlite: any): PulseAlert[] {
  const alerts: PulseAlert[] = []

  const dayOfWeek = new Date().getDay()
  const row = sqlite
    .prepare(
      `SELECT AVG(daily_total) as avg_total FROM (
        SELECT DATE(created_at) as d, SUM(total) as daily_total
        FROM sales
        WHERE status = 'completada'
          AND DATE(created_at) >= DATE('now','localtime','-28 days')
          AND DATE(created_at) < DATE('now','localtime')
          AND CAST(strftime('%w', created_at) AS INTEGER) = ?
        GROUP BY d
      )`
    )
    .get(dayOfWeek) as { avg_total: number | null }

  if (row?.avg_total && row.avg_total > 0) {
    const todayRow = sqlite
      .prepare(
        `SELECT COALESCE(SUM(total), 0) as today_total
         FROM sales
         WHERE status = 'completada' AND DATE(created_at) = DATE('now','localtime')`
      )
      .get() as { today_total: number }

    const deviation = ((todayRow.today_total - row.avg_total) / row.avg_total) * 100
    if (deviation < -30) {
      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      alerts.push({
        type: 'sales',
        severity: deviation < -50 ? 'danger' : 'warning',
        message: `Ventas hoy ${Math.abs(Math.round(deviation))}% por debajo del promedio para ${days[dayOfWeek]}`,
        actionLabel: 'Ver reportes',
        actionRoute: '/reportes'
      })
    }
  }

  return alerts
}

function detectMarginErosion(sqlite: any): PulseAlert[] {
  const alerts: PulseAlert[] = []

  const rows = sqlite
    .prepare(
      `SELECT p.id, p.name, p.cost_price, p.sale_price,
              CASE WHEN p.sale_price > 0
                THEN ((p.sale_price - p.cost_price) / p.sale_price) * 100
                ELSE 0
              END as current_margin,
              AVG(CASE WHEN si.unit_price > 0
                THEN ((si.unit_price - p.cost_price) / si.unit_price) * 100
                ELSE 0
              END) as avg_historical_margin
       FROM products p
       JOIN sale_items si ON si.product_id = p.id
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completada'
         AND DATE(s.created_at) >= DATE('now','localtime','-30 days')
         AND p.is_active = 1
       GROUP BY p.id
       HAVING avg_historical_margin - current_margin > 10`
    )
    .all() as Array<{
    id: number; name: string; cost_price: number; sale_price: number
    current_margin: number; avg_historical_margin: number
  }>

  for (const r of rows.slice(0, 3)) {
    alerts.push({
      type: 'margin',
      severity: r.current_margin < 5 ? 'danger' : 'warning',
      message: `Margen de "${r.name}" cayó a ${r.current_margin.toFixed(0)}% (promedio histórico: ${r.avg_historical_margin.toFixed(0)}%)`,
      actionLabel: 'Ver catálogo',
      actionRoute: '/catalogo'
    })
  }

  return alerts
}

function detectCashDiscrepancies(sqlite: any): PulseAlert[] {
  const alerts: PulseAlert[] = []

  const rows = sqlite
    .prepare(
      `SELECT difference FROM cash_registers
       WHERE status = 'cerrada' AND difference IS NOT NULL
       ORDER BY closed_at DESC LIMIT 10`
    )
    .all() as Array<{ difference: number }>

  if (rows.length >= 3) {
    const negativeCount = rows.filter((r) => r.difference < -500).length
    if (negativeCount >= 3) {
      alerts.push({
        type: 'cash',
        severity: 'danger',
        message: `Faltante de caja detectado en ${negativeCount} de los últimos ${rows.length} cierres`,
        actionLabel: 'Ver caja',
        actionRoute: '/caja'
      })
    }

    const latest = rows[0]
    if (latest && Math.abs(latest.difference) > 5000) {
      alerts.push({
        type: 'cash',
        severity: 'warning',
        message: `Último cierre de caja con diferencia de $${latest.difference.toFixed(0)}`,
        actionLabel: 'Ver caja',
        actionRoute: '/caja'
      })
    }
  }

  return alerts
}

function detectStockVelocityRisk(sqlite: any): PulseAlert[] {
  const alerts: PulseAlert[] = []

  const rows = sqlite
    .prepare(
      `SELECT p.id, p.name, p.stock, p.min_stock,
              COALESCE(SUM(si.quantity), 0) / 30.0 as avg_daily_sales
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id
       LEFT JOIN sales s ON s.id = si.sale_id
         AND s.status = 'completada'
         AND DATE(s.created_at) >= DATE('now','localtime','-30 days')
       WHERE p.is_active = 1 AND p.stock > 0
       GROUP BY p.id
       HAVING avg_daily_sales > 0 AND (p.stock / avg_daily_sales) < 7`
    )
    .all() as Array<{ id: number; name: string; stock: number; min_stock: number; avg_daily_sales: number }>

  for (const r of rows.slice(0, 5)) {
    const daysLeft = Math.round(r.stock / r.avg_daily_sales)
    alerts.push({
      type: 'stock',
      severity: daysLeft <= 3 ? 'danger' : 'warning',
      message: `"${r.name}" se agota en ~${daysLeft} día${daysLeft !== 1 ? 's' : ''} al ritmo actual (stock: ${r.stock})`,
      actionLabel: 'Crear pedido',
      actionRoute: '/compras'
    })
  }

  return alerts
}
