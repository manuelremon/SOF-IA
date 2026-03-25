import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  role: text('role').notNull().default('vendedor'), // 'admin' | 'vendedor' | 'almacenista'
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Products                                                           */
/* ------------------------------------------------------------------ */

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  barcode: text('barcode'),
  sku: text('sku'),
  costPrice: real('cost_price').notNull().default(0),
  salePrice: real('sale_price').notNull().default(0),
  stock: real('stock').notNull().default(0),
  minStock: real('min_stock').notNull().default(0),
  unit: text('unit').notNull().default('unidad'),
  imagePath: text('image_path'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Customers                                                          */
/* ------------------------------------------------------------------ */

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Suppliers                                                          */
/* ------------------------------------------------------------------ */

export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Sales                                                              */
/* ------------------------------------------------------------------ */

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id),
  userId: integer('user_id').references(() => users.id),
  receiptNumber: text('receipt_number').notNull(),
  subtotal: real('subtotal').notNull().default(0),
  taxTotal: real('tax_total').notNull().default(0),
  discountType: text('discount_type'), // 'porcentaje' | 'monto' | null
  discountValue: real('discount_value').notNull().default(0),
  discountTotal: real('discount_total').notNull().default(0),
  total: real('total').notNull().default(0),
  amountTendered: real('amount_tendered').notNull().default(0),
  change: real('change').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('efectivo'),
  status: text('status').notNull().default('completada'), // 'completada' | 'anulada'
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Sale Items                                                         */
/* ------------------------------------------------------------------ */

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id')
    .notNull()
    .references(() => sales.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discountType: text('discount_type'), // 'porcentaje' | 'monto' | null
  discountValue: real('discount_value').notNull().default(0),
  discountTotal: real('discount_total').notNull().default(0),
  lineTotal: real('line_total').notNull()
})

/* ------------------------------------------------------------------ */
/*  Purchase Orders                                                    */
/* ------------------------------------------------------------------ */

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  userId: integer('user_id').references(() => users.id),
  orderNumber: text('order_number').notNull(),
  status: text('status').notNull().default('borrador'), // 'borrador' | 'enviado' | 'recibido_parcial' | 'recibido' | 'cancelado'
  orderDate: text('order_date')
    .notNull()
    .default(sql`(date('now','localtime'))`),
  expectedDate: text('expected_date'),
  subtotal: real('subtotal').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Purchase Order Items                                               */
/* ------------------------------------------------------------------ */

export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer('purchase_order_id')
    .notNull()
    .references(() => purchaseOrders.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  quantityOrdered: real('quantity_ordered').notNull(),
  quantityReceived: real('quantity_received').notNull().default(0),
  unitCost: real('unit_cost').notNull(),
  lineTotal: real('line_total').notNull()
})

/* ------------------------------------------------------------------ */
/*  Goods Receipts                                                     */
/* ------------------------------------------------------------------ */

export const goodsReceipts = sqliteTable('goods_receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer('purchase_order_id')
    .notNull()
    .references(() => purchaseOrders.id),
  userId: integer('user_id').references(() => users.id),
  receiptNumber: text('receipt_number').notNull(),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Goods Receipt Items                                                */
/* ------------------------------------------------------------------ */

export const goodsReceiptItems = sqliteTable('goods_receipt_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  goodsReceiptId: integer('goods_receipt_id')
    .notNull()
    .references(() => goodsReceipts.id),
  purchaseOrderItemId: integer('purchase_order_item_id')
    .notNull()
    .references(() => purchaseOrderItems.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantityReceived: real('quantity_received').notNull()
})

/* ------------------------------------------------------------------ */
/*  App Settings (key-value store)                                     */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Cash Registers                                                     */
/* ------------------------------------------------------------------ */

export const cashRegisters = sqliteTable('cash_registers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  openedAt: text('opened_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  closedAt: text('closed_at'),
  openingAmount: real('opening_amount').notNull().default(0),
  closingAmount: real('closing_amount'),
  expectedAmount: real('expected_amount'),
  difference: real('difference'),
  cashSales: real('cash_sales').notNull().default(0),
  cardSales: real('card_sales').notNull().default(0),
  transferSales: real('transfer_sales').notNull().default(0),
  totalSales: real('total_sales').notNull().default(0),
  salesCount: integer('sales_count').notNull().default(0),
  notes: text('notes'),
  status: text('status').notNull().default('abierta') // 'abierta' | 'cerrada'
})

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})
