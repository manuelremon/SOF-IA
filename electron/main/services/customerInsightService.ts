import { getSqlite } from '../db/connection'

import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import { askAI } from './aiService'
import { eq } from 'drizzle-orm'

export async function generateRecoveryMessage(customerId: number): Promise<string> {
  const profile = getCustomerProfile(customerId)
  if (!profile) return 'Hola, te extrañamos en nuestro local. ¡Vuelve pronto!'

  const productsStr = profile.topProducts.map(p => p.productName).join(', ')
  const prompt = `Genera un mensaje corto, amable y persuasivo para WhatsApp para un cliente llamado "${profile.customerName}". 
El cliente no compra hace tiempo. Sus productos favoritos son: ${productsStr}. 
Ofrécele un descuento del 15% en su próxima compra para que regrese. 
Usa un tono profesional pero cercano (como el dueño de un local de barrio). 
No uses placeholders, genera el texto final. 
Responde ÚNICAMENTE el texto del mensaje.`

  try {
    const message = await askAI(prompt)
    return message.trim()
  } catch (e) {
    return `Hola ${profile.customerName}, hace tiempo que no nos visitas. ¡Te esperamos con un 15% de descuento en tu próxima compra!`
  }
}

export interface CustomerProfile {
  customerId: number
  customerName: string
  totalPurchases: number
  lifetimeValue: number
  avgTicket: number
  lastPurchase: string | null
  firstPurchase: string | null
  avgDaysBetween: number | null
  preferredPayment: string | null
  topProducts: Array<{ productName: string; qty: number; total: number }>
  segment: 'VIP' | 'En riesgo' | 'Nuevo' | 'Ocasional'
}

export function getCustomerProfile(customerId: number): CustomerProfile | null {
  const sqlite = getSqlite()

  const customer = sqlite
    .prepare('SELECT id, name FROM customers WHERE id = ?')
    .get(customerId) as { id: number; name: string } | undefined
  if (!customer) return null

  const stats = sqlite
    .prepare(
      `SELECT COUNT(*) as totalPurchases,
              COALESCE(SUM(total), 0) as lifetimeValue,
              COALESCE(AVG(total), 0) as avgTicket,
              MAX(created_at) as lastPurchase,
              MIN(created_at) as firstPurchase
       FROM sales
       WHERE customer_id = ? AND status = 'completada'`
    )
    .get(customerId) as {
    totalPurchases: number; lifetimeValue: number; avgTicket: number
    lastPurchase: string | null; firstPurchase: string | null
  }

  const topProducts = sqlite
    .prepare(
      `SELECT si.product_name as productName, SUM(si.quantity) as qty, SUM(si.line_total) as total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.customer_id = ? AND s.status = 'completada'
       GROUP BY si.product_id ORDER BY total DESC LIMIT 5`
    )
    .all(customerId) as Array<{ productName: string; qty: number; total: number }>

  const paymentRow = sqlite
    .prepare(
      `SELECT payment_method, COUNT(*) as cnt FROM sales
       WHERE customer_id = ? AND status = 'completada'
       GROUP BY payment_method ORDER BY cnt DESC LIMIT 1`
    )
    .get(customerId) as { payment_method: string; cnt: number } | undefined

  const avgDaysBetween = computeAvgDaysBetween(sqlite, customerId)

  const segment = classifyCustomer(stats.totalPurchases, stats.lifetimeValue, stats.lastPurchase, avgDaysBetween)

  return {
    customerId: customer.id,
    customerName: customer.name,
    totalPurchases: stats.totalPurchases,
    lifetimeValue: stats.lifetimeValue,
    avgTicket: stats.avgTicket,
    lastPurchase: stats.lastPurchase,
    firstPurchase: stats.firstPurchase,
    avgDaysBetween,
    preferredPayment: paymentRow?.payment_method ?? null,
    topProducts,
    segment
  }
}

export function getAtRiskCustomers(): Array<CustomerProfile & { daysSinceLastPurchase: number }> {
  const sqlite = getSqlite()

  const customers = sqlite
    .prepare(
      `SELECT customer_id, COUNT(*) as purchases,
              MAX(created_at) as last_purchase
       FROM sales
       WHERE status = 'completada' AND customer_id IS NOT NULL
       GROUP BY customer_id
       HAVING purchases >= 3`
    )
    .all() as Array<{ customer_id: number; purchases: number; last_purchase: string }>

  const results: Array<CustomerProfile & { daysSinceLastPurchase: number }> = []

  for (const c of customers) {
    const avgDays = computeAvgDaysBetween(sqlite, c.customer_id)
    if (!avgDays || avgDays <= 0) continue

    const daysSince = Math.round(
      (Date.now() - new Date(c.last_purchase).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSince > avgDays * 2) {
      const profile = getCustomerProfile(c.customer_id)
      if (profile) {
        results.push({ ...profile, daysSinceLastPurchase: daysSince })
      }
    }
  }

  return results.sort((a, b) => b.lifetimeValue - a.lifetimeValue)
}

export function getCustomerSegmentation(): Array<{
  customerId: number; customerName: string; segment: string
  totalPurchases: number; lifetimeValue: number; avgTicket: number
  lastPurchase: string | null
}> {
  const sqlite = getSqlite()

  const customers = sqlite
    .prepare(
      `SELECT c.id, c.name,
              COUNT(s.id) as totalPurchases,
              COALESCE(SUM(s.total), 0) as lifetimeValue,
              COALESCE(AVG(s.total), 0) as avgTicket,
              MAX(s.created_at) as lastPurchase
       FROM customers c
       LEFT JOIN sales s ON s.customer_id = c.id AND s.status = 'completada'
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY lifetimeValue DESC`
    )
    .all() as Array<{
    id: number; name: string; totalPurchases: number
    lifetimeValue: number; avgTicket: number; lastPurchase: string | null
  }>

  return customers.map((c) => {
    const avgDays = computeAvgDaysBetween(sqlite, c.id)
    return {
      customerId: c.id,
      customerName: c.name,
      segment: classifyCustomer(c.totalPurchases, c.lifetimeValue, c.lastPurchase, avgDays),
      totalPurchases: c.totalPurchases,
      lifetimeValue: c.lifetimeValue,
      avgTicket: c.avgTicket,
      lastPurchase: c.lastPurchase
    }
  })
}

function computeAvgDaysBetween(sqlite: any, customerId: number): number | null {
  const dates = sqlite
    .prepare(
      `SELECT DATE(created_at) as d FROM sales
       WHERE customer_id = ? AND status = 'completada'
       GROUP BY DATE(created_at) ORDER BY d`
    )
    .all(customerId) as Array<{ d: string }>

  if (dates.length < 2) return null

  let totalDays = 0
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i].d).getTime() - new Date(dates[i - 1].d).getTime()) / (1000 * 60 * 60 * 24)
    totalDays += diff
  }

  return Math.round(totalDays / (dates.length - 1))
}

function classifyCustomer(
  totalPurchases: number,
  lifetimeValue: number,
  lastPurchase: string | null,
  avgDaysBetween: number | null
): 'VIP' | 'En riesgo' | 'Nuevo' | 'Ocasional' {
  if (totalPurchases < 3) return 'Nuevo'

  if (lastPurchase && avgDaysBetween && avgDaysBetween > 0) {
    const daysSince = (Date.now() - new Date(lastPurchase).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > avgDaysBetween * 2) return 'En riesgo'
  }

  // VIP: frequent (buys at least every 30 days on avg) and high value
  if (avgDaysBetween && avgDaysBetween <= 30 && totalPurchases >= 5) return 'VIP'

  return 'Ocasional'
}
