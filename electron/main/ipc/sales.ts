import { ipcMain } from 'electron'
import * as salesService from '../services/salesService'
import { CompleteSaleSchema } from '../utils/validators'

export function registerSalesHandlers(): void {
  ipcMain.handle('sales:complete', async (_e, data) => {
    try {
      const parsedData = CompleteSaleSchema.parse(data)
      return { ok: true, data: salesService.completeSale(parsedData) }
    }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('sales:list', async (_e, filters) => {
    try { return { ok: true, data: salesService.listSales(filters) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('sales:getById', async (_e, id) => {
    try { return { ok: true, data: salesService.getSaleById(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('sales:cancel', async (_e, data) => {
    try { return { ok: true, data: salesService.cancelSale(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('sales:dailySummary', async (_e, date) => {
    try { return { ok: true, data: salesService.dailySummary(date) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('sales:topProducts', async (_e, limit, from, to) => {
    try { return { ok: true, data: salesService.topProducts(limit, from, to) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('sales:profitability', async (_e, saleId) => {
    try { return { ok: true, data: salesService.getSaleProfitability(saleId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
