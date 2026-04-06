import { ipcMain } from 'electron'
import * as scorecardService from '../services/supplierScorecardService'

export function registerSupplierScorecardHandlers(): void {
  ipcMain.handle('supplierScorecard:get', async (_e, supplierId: number) => {
    try { return { ok: true, data: scorecardService.getSupplierScorecard(supplierId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('supplierScorecard:ranking', async () => {
    try { return { ok: true, data: scorecardService.getSupplierRanking() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
