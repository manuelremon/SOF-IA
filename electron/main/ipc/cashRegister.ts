import { ipcMain } from 'electron'
import * as cashRegisterService from '../services/cashRegisterService'

export function registerCashRegisterHandlers(): void {
  ipcMain.handle('cashRegister:open', async (_e, data) => {
    try { return { ok: true, data: cashRegisterService.openRegister(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('cashRegister:current', async () => {
    try { return { ok: true, data: cashRegisterService.getCurrentRegister() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('cashRegister:close', async (_e, data) => {
    try { return { ok: true, data: cashRegisterService.closeRegister(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('cashRegister:list', async (_e, limit) => {
    try { return { ok: true, data: cashRegisterService.listRegisters(limit) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('cashRegister:liveSnapshot', async () => {
    try { return { ok: true, data: cashRegisterService.getLiveSnapshot() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('cashRegister:addCash', async (_e, data) => {
    try { return { ok: true, data: cashRegisterService.addCash(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('cashRegister:movements', async (_e, filters) => {
    try { return { ok: true, data: cashRegisterService.getMovements(filters) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
