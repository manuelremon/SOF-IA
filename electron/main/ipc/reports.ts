import { ipcMain } from 'electron'
import * as reportService from '../services/reportService'

export function registerReportHandlers(): void {
  ipcMain.handle('reports:byPeriod', async (_e, from, to, groupBy) => {
    try { return { ok: true, data: reportService.salesByPeriod(from, to, groupBy) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('reports:byProduct', async (_e, from, to) => {
    try { return { ok: true, data: reportService.salesByProduct(from, to) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('reports:byPaymentMethod', async (_e, from, to) => {
    try { return { ok: true, data: reportService.salesByPaymentMethod(from, to) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('reports:byCustomer', async (_e, from, to) => {
    try { return { ok: true, data: reportService.salesByCustomer(from, to) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('reports:profit', async (_e, from, to) => {
    try { return { ok: true, data: reportService.profitReport(from, to) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
