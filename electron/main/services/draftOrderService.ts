import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

export function listPending() {
  const db = getDb()
  return db.select()
    .from(schema.draftOrders)
    .where(eq(schema.draftOrders.status, 'pendiente'))
    .orderBy(desc(schema.draftOrders.createdAt))
    .all()
}

export function updateStatus(id: number, status: 'procesada' | 'cancelada') {
  const db = getDb()
  return db.update(schema.draftOrders)
    .set({ status })
    .where(eq(schema.draftOrders.id, id))
    .run()
}
