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
/*  Businesses                                                         */
/* ------------------------------------------------------------------ */

export const businesses = sqliteTable('businesses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  industry: text('industry'), // 'comercio', 'gastronomia', etc.
  logoPath: text('logo_path'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  User-Business Relations                                            */
/* ------------------------------------------------------------------ */

export const userBusinesses = sqliteTable('user_businesses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  createdAt: text('created_at')
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
  brand: text('brand'),
  presentation: text('presentation'),
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
  cuit: text('cuit'),
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
  auditImagePath: text('audit_image_path'),
  // AFIP Fields
  afipInvoiceType: integer('afip_invoice_type'), // 1=Fact A, 6=Fact B, 11=Fact C
  afipInvoiceNumber: text('afip_invoice_number'), // 0001-00000001
  afipCae: text('afip_cae'),
  afipCaeExpiration: text('afip_cae_expiration'),
  afipDocType: integer('afip_doc_type'), // 80=CUIT, 96=DNI, etc.
  afipDocNumber: text('afip_doc_number'),
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
/*  Draft Orders (Rompefilas)                                          */
/* ------------------------------------------------------------------ */

export const draftOrders = sqliteTable('draft_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  status: text('status').notNull().default('pendiente'), // 'pendiente' | 'procesada' | 'cancelada'
  itemsJson: text('items_json').notNull(), // JSON string de los items del carrito
  total: real('total').notNull().default(0),
  deviceName: text('device_name'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
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
  supplierRemito: text('supplier_remito'),
  supplierInvoice: text('supplier_invoice'),
  totalAmount: real('total_amount'),
  paymentMethod: text('payment_method'),
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
  quantityReceived: real('quantity_received').notNull(),
  unitCost: real('unit_cost'),
  expirationDate: text('expiration_date')
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

export const cashMovements = sqliteTable('cash_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  registerId: integer('register_id').references(() => cashRegisters.id),
  type: text('type').notNull(), // 'ingreso' | 'egreso'
  amount: real('amount').notNull(),
  description: text('description'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Customer Accounts (Cuentas Corrientes / Fiado)                     */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Supplier Products (Catálogo del proveedor)                         */
/* ------------------------------------------------------------------ */

export const supplierProducts = sqliteTable('supplier_products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  supplierCode: text('supplier_code'),
  supplierPrice: real('supplier_price').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Customer Accounts (Cuentas Corrientes / Fiado)                     */
/* ------------------------------------------------------------------ */

export const customerAccounts = sqliteTable('customer_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id)
    .unique(),
  balance: real('balance').notNull().default(0),
  creditLimit: real('credit_limit').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

export const customerAccountMovements = sqliteTable('customer_account_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerAccountId: integer('customer_account_id')
    .notNull()
    .references(() => customerAccounts.id),
  saleId: integer('sale_id').references(() => sales.id),
  type: text('type').notNull(), // 'cargo' | 'abono'
  amount: real('amount').notNull(),
  description: text('description'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

/* ------------------------------------------------------------------ */
/*  Audit Logs                                                         */
/* ------------------------------------------------------------------ */

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  entityType: text('entity_type').notNull(), // 'product', 'sale', etc.
  entityId: integer('entity_id').notNull(),
  action: text('action').notNull(), // 'create', 'update', 'delete', 'adjust_stock'
  oldValue: text('old_value'), // JSON string
  newValue: text('new_value'), // JSON string
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})
