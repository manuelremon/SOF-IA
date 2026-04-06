import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import * as XLSX from 'xlsx'
import * as spService from '../services/supplierProductService'

export function registerSupplierProductHandlers(): void {
  ipcMain.handle('supplierProducts:list', async (_e, supplierId: number) => {
    try { return { ok: true, data: spService.listBySupplier(supplierId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('supplierProducts:listByProduct', async (_e, productId: number) => {
    try { return { ok: true, data: spService.listByProduct(productId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('supplierProducts:add', async (_e, data: any) => {
    try { return { ok: true, data: spService.addProduct(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('supplierProducts:remove', async (_e, supplierId: number, productId: number) => {
    try { return { ok: true, data: spService.removeProduct(supplierId, productId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('supplierProducts:cheapest', async (_e, productIds: number[]) => {
    try { return { ok: true, data: spService.getCheapestSuppliers(productIds) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  // Download empty template XLSX with all products
  ipcMain.handle('supplierProducts:downloadTemplate', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win!, {
      title: 'Descargar plantilla de catálogo',
      defaultPath: 'plantilla-catalogo-proveedor.xlsx',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return { ok: true, data: { success: false } }

    try {
      const data = spService.getTemplateData()
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = [
        { wch: 15 }, // codigo_barras
        { wch: 12 }, // sku
        { wch: 40 }, // nombre_producto
        { wch: 15 }, // codigo_proveedor
        { wch: 18 }  // precio_proveedor
      ]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Catálogo')
      XLSX.writeFile(wb, result.filePath)
      return { ok: true, data: { success: true, path: result.filePath } }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  // Export current supplier catalog to XLSX
  ipcMain.handle('supplierProducts:exportCatalog', async (_e, supplierId: number, supplierName: string) => {
    const win = BrowserWindow.getFocusedWindow()
    const safeName = supplierName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').slice(0, 30)
    const result = await dialog.showSaveDialog(win!, {
      title: 'Exportar catálogo del proveedor',
      defaultPath: `catalogo-${safeName}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return { ok: true, data: { success: false } }

    try {
      const catalog = spService.listBySupplier(supplierId)
      const data = (catalog as any[]).map((item) => ({
        codigo_barras: item.barcode || '',
        sku: item.sku || '',
        nombre_producto: item.productName,
        codigo_proveedor: item.supplierCode || '',
        precio_proveedor: item.supplierPrice,
        precio_venta: item.salePrice
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 18 }, { wch: 18 }
      ]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Catálogo')
      XLSX.writeFile(wb, result.filePath)
      return { ok: true, data: { success: true, path: result.filePath } }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  // Import XLSX catalog
  ipcMain.handle('supplierProducts:importXlsx', async (_e, supplierId: number) => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: 'Importar catálogo de proveedor',
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { ok: true, data: { imported: 0, skipped: 0 } }

    try {
      const wb = XLSX.readFile(result.filePaths[0])
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any>(ws)

      const items = rows.map((row: any) => ({
        barcode: String(row.codigo_barras || row['Código Barras'] || row.barcode || '').trim() || undefined,
        sku: String(row.sku || row.SKU || '').trim() || undefined,
        supplierCode: String(row.codigo_proveedor || row['Código Proveedor'] || '').trim() || undefined,
        supplierPrice: parseFloat(row.precio_proveedor || row['Precio Proveedor'] || row.precio || 0) || 0
      })).filter((item: any) => (item.barcode || item.sku) && item.supplierPrice > 0)

      const importResult = spService.importCatalog(supplierId, items)
      return { ok: true, data: importResult }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
