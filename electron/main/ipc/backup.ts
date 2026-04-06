import { ipcMain } from 'electron'
import * as backupService from '../services/backupService'
import * as exportService from '../services/exportService'

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:create', async () => {
    try { return { ok: true, data: await backupService.createBackup() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('backup:restore', async () => {
    try { return { ok: true, data: await backupService.restoreBackup() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('export:products', async () => {
    try { return { ok: true, data: await exportService.exportProducts() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('export:sales', async (_e, from?: string, to?: string) => {
    try { return { ok: true, data: await exportService.exportSales(from, to) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('export:customers', async () => {
    try { return { ok: true, data: await exportService.exportCustomers() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
