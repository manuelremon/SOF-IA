import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import { sql, eq, and } from 'drizzle-orm'
import { getSetting } from './settingsService'

export function getCashFlowProjection() {
  const db = getDb()
  
  // 1. Efectivo actual en caja (solo si está abierta)
  const currentRegister = db.select({
    total: schema.cashRegisters.cashInRegister
  })
  .from(schema.cashRegisters)
  .where(eq(schema.cashRegisters.status, 'abierta'))
  .get()
  
  const currentCash = currentRegister?.total || 0

  // 2. Ventas promedio diarias (últimos 30 días)
  const avgSalesRow = db.select({
    avgDaily: sql<number>`COALESCE(SUM(total), 0) / 30.0`
  })
  .from(schema.sales)
  .where(and(
    eq(schema.sales.status, 'completada'),
    sql`created_at >= date('now', '-30 days')`
  ))
  .get()

  const avgDailySales = avgSalesRow?.avgDaily || 0
  const projectedIncome30d = avgDailySales * 30

  // 3. Egresos comprometidos (Órdenes de Compra pendientes/enviadas)
  const pendingOrdersRow = db.select({
    totalPending: sql<number>`COALESCE(SUM(subtotal), 0)`
  })
  .from(schema.purchaseOrders)
  .where(sql`status IN ('enviado', 'recibido_parcial', 'borrador')`)
  .get()

  const pendingExpenses = pendingOrdersRow?.totalPending || 0

  // 4. Proyección a 30 días
  const projection30d = currentCash + projectedIncome30d - pendingExpenses

  return {
    currentCash,
    avgDailySales,
    projectedIncome30d,
    pendingExpenses,
    projection30d,
    timestamp: new Date().toISOString()
  }
}
