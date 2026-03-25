import { ipcMain } from 'electron'
import * as purchaseOrderService from '../services/purchaseOrderService'

export function registerPurchaseOrderHandlers(): void {
  ipcMain.handle('purchaseOrders:list', async (_e, filters) => {
    try { return { ok: true, data: purchaseOrderService.listPurchaseOrders(filters) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('purchaseOrders:getById', async (_e, id) => {
    try { return { ok: true, data: purchaseOrderService.getPurchaseOrderById(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('purchaseOrders:create', async (_e, data) => {
    try { return { ok: true, data: purchaseOrderService.createPurchaseOrder(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('purchaseOrders:update', async (_e, data) => {
    try { return { ok: true, data: purchaseOrderService.updatePurchaseOrder(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('purchaseOrders:updateStatus', async (_e, data) => {
    try { return { ok: true, data: purchaseOrderService.updatePurchaseOrderStatus(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('purchaseOrders:cancel', async (_e, id) => {
    try { return { ok: true, data: purchaseOrderService.cancelPurchaseOrder(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
