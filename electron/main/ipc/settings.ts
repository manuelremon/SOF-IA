import { ipcMain } from 'electron'
import * as settingsService from '../services/settingsService'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', async () => {
    try { return { ok: true, data: settingsService.getAllSettings() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('settings:get', async (_e, key) => {
    try { return { ok: true, data: settingsService.getSetting(key) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('settings:set', async (_e, key, value) => {
    try { settingsService.setSetting(key, value); return { ok: true } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('settings:setBatch', async (_e, entries) => {
    try {
      settingsService.setSettingsBatch(entries)
      if (entries.auto_backup_interval_hours !== undefined) {
        const interval = Number(entries.auto_backup_interval_hours)
        require('../services/backupService').startAutoBackupTimer(interval)
      }
      return { ok: true }
    }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
