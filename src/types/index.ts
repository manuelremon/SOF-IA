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
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: number
  customerId: number | null
  userId: number | null
  receiptNumber: string
  subtotal: number
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
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface CartItem {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  stock: number
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

export interface AppSettings {
  business_name: string
  business_address: string
  business_phone: string
  business_tax_id: string
  tax_rate: string
  currency: string
  receipt_footer: string
  [key: string]: string
}
