import { ipcMain } from 'electron'
import * as hardwareService from '../services/hardwareService'

export function registerHardwareHandlers() {
  ipcMain.handle('hardware:readScale', async () => {
    try {
      const weight = await hardwareService.readScaleWeight()
      return { ok: true, data: weight }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })
}
