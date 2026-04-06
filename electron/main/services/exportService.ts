import { dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'
import { getSqlite } from '../db/connection'

function toCsv(columns: string[], rows: any[]): string {
  const header = columns.join(',')
  const lines = rows.map((row) =>
    columns.map((col) => {
      const val = row[col]
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  )
  return '\uFEFF' + header + '\n' + lines.join('\n')
}

async function saveFile(defaultName: string, content: string): Promise<{ success: boolean; path?: string; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showSaveDialog(win!, {
    title: 'Exportar a CSV',
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelado' }
  }

  try {
    writeFileSync(result.filePath, content, 'utf-8')
    return { success: true, path: result.filePath }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function exportProducts() {
  const sqlite = getSqlite()
  const rows = sqlite.prepare(
    `SELECT p.id, p.name, p.barcode, p.sku, p.cost_price, p.sale_price,
            p.stock, p.min_stock, p.unit, c.name as category, p.is_active
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.name`
  ).all()

  const csv = toCsv(
    ['id', 'name', 'barcode', 'sku', 'cost_price', 'sale_price', 'stock', 'min_stock', 'unit', 'category', 'is_active'],
    rows
  )
  return saveFile(`productos-${new Date().toISOString().slice(0, 10)}.csv`, csv)
}

export async function exportSales(from?: string, to?: string) {
  const sqlite = getSqlite()
  let query = `SELECT s.id, s.receipt_number, s.created_at, s.subtotal, s.discount_total,
                      s.tax_total, s.total, s.payment_method, s.status,
                      c.name as customer_name, u.name as user_name
               FROM sales s
               LEFT JOIN customers c ON c.id = s.customer_id
               LEFT JOIN users u ON u.id = s.user_id
               WHERE 1=1`
  const params: string[] = []
  if (from) { query += ' AND DATE(s.created_at) >= ?'; params.push(from) }
  if (to) { query += ' AND DATE(s.created_at) <= ?'; params.push(to) }
  query += ' ORDER BY s.created_at DESC'

  const rows = sqlite.prepare(query).all(...params)
  const csv = toCsv(
    ['id', 'receipt_number', 'created_at', 'subtotal', 'discount_total', 'tax_total', 'total', 'payment_method', 'status', 'customer_name', 'user_name'],
    rows
  )
  return saveFile(`ventas-${from || 'all'}-${to || 'all'}.csv`, csv)
}

export async function exportCustomers() {
  const sqlite = getSqlite()
  const rows = sqlite.prepare(
    `SELECT c.id, c.name, c.phone, c.email, c.address, c.is_active,
            COALESCE(ca.balance, 0) as balance, COALESCE(ca.credit_limit, 0) as credit_limit
     FROM customers c
     LEFT JOIN customer_accounts ca ON ca.customer_id = c.id
     ORDER BY c.name`
  ).all()

  const csv = toCsv(
    ['id', 'name', 'phone', 'email', 'address', 'is_active', 'balance', 'credit_limit'],
    rows
  )
  return saveFile(`clientes-${new Date().toISOString().slice(0, 10)}.csv`, csv)
}
