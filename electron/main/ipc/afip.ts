import { ipcMain } from 'electron'
import * as afipService from '../services/afipService'

export function registerAfipHandlers() {
  ipcMain.handle('afip:getServerStatus', async () => {
    try {
      const data = await afipService.getServerStatus()
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('afip:createVoucher', async (_event, data: afipService.AfipVoucherData) => {
    try {
      const result = await afipService.createVoucher(data)
      return { ok: true, data: result }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('afip:getIvaTypes', async () => {
    try {
      const data = await afipService.getIvaTypes()
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('afip:getDocumentTypes', async () => {
    try {
      const data = await afipService.getDocumentTypes()
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })
}
