import { ipcMain } from 'electron'
import * as grService from '../services/goodsReceiptService'

export function registerGoodsReceiptHandlers(): void {
  ipcMain.handle('goodsReceipts:receive', async (_e, data) => {
    try { return { ok: true, data: grService.receiveGoods(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('goodsReceipts:list', async (_e, filters) => {
    try { return { ok: true, data: grService.listGoodsReceipts(filters) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('goodsReceipts:getById', async (_e, id) => {
    try { return { ok: true, data: grService.getGoodsReceiptById(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
