import { ipcMain } from 'electron'
import * as accountService from '../services/customerAccountService'

export function registerCustomerAccountHandlers(): void {
  ipcMain.handle('customerAccount:get', async (_e, customerId: number) => {
    try { return { ok: true, data: accountService.getAccountWithMovements(customerId) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('customerAccount:charge', async (_e, data: any) => {
    try { return { ok: true, data: accountService.chargeToAccount(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('customerAccount:payment', async (_e, data: any) => {
    try { return { ok: true, data: accountService.registerPayment(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('customerAccount:updateLimit', async (_e, customerId: number, creditLimit: number) => {
    try { return { ok: true, data: accountService.updateCreditLimit(customerId, creditLimit) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('customerAccount:debtors', async () => {
    try { return { ok: true, data: accountService.getDebtorsSummary() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })

  ipcMain.handle('customerAccount:totalDebt', async () => {
    try { return { ok: true, data: accountService.getTotalDebt() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
