import { ipcMain } from 'electron'
import * as customerService from '../services/customerService'

export function registerCustomerHandlers(): void {
  ipcMain.handle('customers:list', async (_e, filters) => {
    try { return { ok: true, data: customerService.listCustomers(filters) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('customers:getById', async (_e, id) => {
    try { return { ok: true, data: customerService.getCustomerById(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('customers:create', async (_e, data) => {
    try { return { ok: true, data: customerService.createCustomer(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('customers:update', async (_e, data) => {
    try { return { ok: true, data: customerService.updateCustomer(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('customers:delete', async (_e, id) => {
    try { return { ok: true, data: customerService.deleteCustomer(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
