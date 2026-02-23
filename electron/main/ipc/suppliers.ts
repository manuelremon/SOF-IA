import { ipcMain } from 'electron'
import * as supplierService from '../services/supplierService'

export function registerSupplierHandlers(): void {
  ipcMain.handle('suppliers:list', async (_e, filters) => {
    try { return { ok: true, data: supplierService.listSuppliers(filters) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('suppliers:getById', async (_e, id) => {
    try { return { ok: true, data: supplierService.getSupplierById(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('suppliers:create', async (_e, data) => {
    try { return { ok: true, data: supplierService.createSupplier(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('suppliers:update', async (_e, data) => {
    try { return { ok: true, data: supplierService.updateSupplier(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('suppliers:delete', async (_e, id) => {
    try { return { ok: true, data: supplierService.deleteSupplier(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
