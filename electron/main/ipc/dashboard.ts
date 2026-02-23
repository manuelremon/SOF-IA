import { ipcMain } from 'electron'
import * as dashboardService from '../services/dashboardService'

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:kpis', async () => {
    try { return { ok: true, data: dashboardService.getKpis() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('dashboard:salesChart', async (_e, days) => {
    try { return { ok: true, data: dashboardService.getSalesChart(days) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('dashboard:topProducts', async (_e, limit) => {
    try { return { ok: true, data: dashboardService.getTopProducts(limit) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('dashboard:recentSales', async (_e, limit) => {
    try { return { ok: true, data: dashboardService.getRecentSales(limit) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
