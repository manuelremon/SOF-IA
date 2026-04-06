import { ipcMain } from 'electron'
import * as autopilotService from '../services/autopilotService'

export function registerAutopilotHandlers(): void {
  ipcMain.handle('autopilot:preview', async (_e, coverageDays?: number) => {
    try { return { ok: true, data: autopilotService.previewAutoPOs(coverageDays) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('autopilot:generate', async (_e, userId: number | null, coverageDays?: number) => {
    try { return { ok: true, data: autopilotService.generateAutoPOs(userId, coverageDays) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
