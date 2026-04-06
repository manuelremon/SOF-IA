import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export function getOrCreateAccount(customerId: number) {
  const db = getDb()
  let account = db
    .select()
    .from(schema.customerAccounts)
    .where(eq(schema.customerAccounts.customerId, customerId))
    .get()

  if (!account) {
    account = db
      .insert(schema.customerAccounts)
      .values({ customerId, balance: 0, creditLimit: 0 })
      .returning()
      .get()
  }

  return account
}

export function getAccountWithMovements(customerId: number, limit = 50) {
  const db = getDb()
  const account = getOrCreateAccount(customerId)

  const movements = db
    .select()
    .from(schema.customerAccountMovements)
    .where(eq(schema.customerAccountMovements.customerAccountId, account.id))
    .orderBy(desc(schema.customerAccountMovements.createdAt))
    .limit(limit)
    .all()

  const customer = db
    .select({ name: schema.customers.name })
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .get()

  return {
    ...account,
    customerName: customer?.name ?? '',
    movements
  }
}

export function chargeToAccount(data: {
  customerId: number
  saleId: number
  amount: number
  description?: string
}) {
  const db = getDb()
  const account = getOrCreateAccount(data.customerId)

  if (account.creditLimit > 0 && account.balance + data.amount > account.creditLimit) {
    throw new Error(
      `Límite de crédito excedido. Saldo actual: $${account.balance.toFixed(2)}, Límite: $${account.creditLimit.toFixed(2)}`
    )
  }

  return getSqlite().transaction(() => {
    db.insert(schema.customerAccountMovements)
      .values({
        customerAccountId: account.id,
        saleId: data.saleId,
        type: 'cargo',
        amount: data.amount,
        description: data.description ?? 'Venta a cuenta'
      })
      .run()

    db.update(schema.customerAccounts)
      .set({
        balance: sql`balance + ${data.amount}`,
        updatedAt: sql`(datetime('now','localtime'))`
      })
      .where(eq(schema.customerAccounts.id, account.id))
      .run()

    return db.select().from(schema.customerAccounts)
      .where(eq(schema.customerAccounts.id, account.id)).get()
  })()
}

export function registerPayment(data: {
  customerId: number
  amount: number
  description?: string
}) {
  const db = getDb()
  const account = getOrCreateAccount(data.customerId)

  if (data.amount <= 0) throw new Error('El monto del pago debe ser mayor a 0')

  return getSqlite().transaction(() => {
    db.insert(schema.customerAccountMovements)
      .values({
        customerAccountId: account.id,
        saleId: null,
        type: 'abono',
        amount: data.amount,
        description: data.description ?? 'Pago recibido'
      })
      .run()

    db.update(schema.customerAccounts)
      .set({
        balance: sql`balance - ${data.amount}`,
        updatedAt: sql`(datetime('now','localtime'))`
      })
      .where(eq(schema.customerAccounts.id, account.id))
      .run()

    return db.select().from(schema.customerAccounts)
      .where(eq(schema.customerAccounts.id, account.id)).get()
  })()
}

export function updateCreditLimit(customerId: number, creditLimit: number) {
  const db = getDb()
  const account = getOrCreateAccount(customerId)

  db.update(schema.customerAccounts)
    .set({ creditLimit, updatedAt: sql`(datetime('now','localtime'))` })
    .where(eq(schema.customerAccounts.id, account.id))
    .run()

  return db.select().from(schema.customerAccounts)
    .where(eq(schema.customerAccounts.id, account.id)).get()
}

export function getDebtorsSummary() {
  const sqlite = getSqlite()
  return sqlite
    .prepare(
      `SELECT ca.id, ca.customer_id as customerId, c.name as customerName,
              ca.balance, ca.credit_limit as creditLimit, ca.updated_at as updatedAt
       FROM customer_accounts ca
       JOIN customers c ON c.id = ca.customer_id
       WHERE ca.balance > 0
       ORDER BY ca.balance DESC`
    )
    .all()
}

export function getTotalDebt(): number {
  const sqlite = getSqlite()
  const row = sqlite
    .prepare('SELECT COALESCE(SUM(balance), 0) as total FROM customer_accounts WHERE balance > 0')
    .get() as { total: number }
  return row.total
}
