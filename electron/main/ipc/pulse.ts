import { ipcMain } from 'electron'
import * as pulseService from '../services/pulseService'

export function registerPulseHandlers(): void {
  ipcMain.handle('pulse:getAlerts', async () => {
    try { return { ok: true, data: pulseService.getAlerts() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
