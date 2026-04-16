export interface User {
  id: number
  name: string
  role: 'admin' | 'vendedor' | 'almacenista'
  isActive: boolean
  createdAt: string
}

export interface Category {
  id: number
  name: string
  color: string | null
  isActive: boolean
  createdAt: string
}

export interface Product {
  id: number
  categoryId: number | null
  name: string
  description: string | null
  brand: string | null
  presentation: string | null
  barcode: string | null
  sku: string | null
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  unit: string
  imagePath: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  categoryName: string | null
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: number
  name: string
  cuit: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type DiscountType = 'porcentaje' | 'monto' | null

export interface Sale {
  id: number
  customerId: number | null
  userId: number | null
  receiptNumber: string
  subtotal: number
  discountType: DiscountType
  discountValue: number
  discountTotal: number
  taxTotal: number
  total: number
  amountTendered: number
  change: number
  paymentMethod: string
  status: string
  notes: string | null
  createdAt: string
  customerName?: string | null
  userName?: string | null
  items?: SaleItem[]
  // AFIP Fields
  afipInvoiceType?: number
  afipInvoiceNumber?: string | null
  afipCae?: string | null
  afipCaeExpiration?: string | null
  afipDocType?: number
  afipDocNumber?: string | null
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  discountType: DiscountType
  discountValue: number
  discountTotal: number
  lineTotal: number
}

export interface CartItem {
  productId: number
  productName: string
  unitPrice: number
  costPrice: number
  quantity: number
  unit: string
  stock: number
  discountType?: DiscountType
  discountValue?: number
}

export interface IpcResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

export interface KpiData {
  ventasHoy: number
  ingresoHoy: number
  ventasMes: number
  ingresoMes: number
  productos: number
  stockBajo: number
  clientes: number
}

export interface SalesChartPoint {
  date: string
  total: number
  count: number
}

export interface TopProduct {
  name: string
  qty: number
  revenue: number
}

export interface RecentSale {
  id: number
  receiptNumber: string
  total: number
  paymentMethod: string
  createdAt: string
  customerName: string
}

/* ------------------------------------------------------------------ */
/*  Purchase Orders                                                    */
/* ------------------------------------------------------------------ */

export type POStatus = 'borrador' | 'enviado' | 'recibido_parcial' | 'recibido' | 'cancelado'

export interface PurchaseOrder {
  id: number
  supplierId: number
  userId: number | null
  orderNumber: string
  status: POStatus
  orderDate: string
  expectedDate: string | null
  subtotal: number
  notes: string | null
  createdAt: string
  updatedAt: string
  supplierName?: string
  userName?: string
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: number
  purchaseOrderId: number
  productId: number
  productName: string
  quantityOrdered: number
  quantityReceived: number
  unitCost: number
  lineTotal: number
}

/* ------------------------------------------------------------------ */
/*  Goods Receipts                                                     */
/* ------------------------------------------------------------------ */

export interface GoodsReceipt {
  id: number
  purchaseOrderId: number
  userId: number | null
  receiptNumber: string
  notes: string | null
  createdAt: string
  orderNumber?: string
  supplierName?: string
  userName?: string
  items?: GoodsReceiptItem[]
}

export interface GoodsReceiptItem {
  id: number
  goodsReceiptId: number
  purchaseOrderItemId: number
  productId: number
  quantityReceived: number
  productName?: string
}

export interface AppSettings {
  business_name: string
  business_address: string
  business_city: string
  business_province: string
  business_postal_code: string
  business_phone: string
  business_phone_alt: string
  business_email: string
  mp_access_token: string
  mp_pos_id: string
  whatsapp_access_token: string
  whatsapp_phone_id: string
  business_tax_id: string
  tax_rate: string
  currency: string
  receipt_footer: string
  // AFIP Settings
  afip_cuit?: string
  afip_pto_vta?: string
  afip_env?: string
  afip_cert_path?: string
  afip_key_path?: string
  auto_backup_interval_hours?: string
  sounds_enabled?: string
  theme?: string
  [key: string]: string | undefined
}
