import { ipcMain } from 'electron'
import * as productService from '../services/productService'

export function registerProductHandlers(): void {
  // Categories
  ipcMain.handle('categories:list', async () => {
    try { return { ok: true, data: productService.listCategories() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('categories:create', async (_e, data) => {
    try { return { ok: true, data: productService.createCategory(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('categories:update', async (_e, data) => {
    try { return { ok: true, data: productService.updateCategory(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('categories:delete', async (_e, id) => {
    try { return { ok: true, data: productService.deleteCategory(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  // Products
  ipcMain.handle('products:list', async (_e, filters) => {
    try { return { ok: true, data: productService.listProducts(filters) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:getById', async (_e, id) => {
    try { return { ok: true, data: productService.getProductById(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:create', async (_e, data) => {
    try { return { ok: true, data: productService.createProduct(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:update', async (_e, data) => {
    try { return { ok: true, data: productService.updateProduct(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:delete', async (_e, id) => {
    try { return { ok: true, data: productService.deleteProduct(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:search', async (_e, query) => {
    try { return { ok: true, data: productService.searchProducts(query) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:adjustStock', async (_e, data) => {
    try { return { ok: true, data: productService.adjustStock(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:lowStock', async () => {
    try { return { ok: true, data: productService.lowStockProducts() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:bulkPricePreview', async (_e, filters, adjustment) => {
    try { return { ok: true, data: productService.bulkPricePreview(filters, adjustment) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('products:bulkPriceApply', async (_e, updates) => {
    try { return { ok: true, data: productService.bulkPriceApply(updates) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
