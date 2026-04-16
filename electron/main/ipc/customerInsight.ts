import { ipcMain } from 'electron'
import * as insightService from '../services/customerInsightService'

export function registerCustomerInsightHandlers(): void {
  ipcMain.handle('customerInsight:profile', async (_e, customerId: number) => {
    try { return { ok: true, data: insightService.getCustomerProfile(customerId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('customerInsight:generateMessage', async (_e, customerId: number) => {
    try { return { ok: true, data: await insightService.generateRecoveryMessage(customerId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('customerInsight:atRisk', async () => {
    try { return { ok: true, data: insightService.getAtRiskCustomers() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('customerInsight:segmentation', async () => {
    try { return { ok: true, data: insightService.getCustomerSegmentation() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
