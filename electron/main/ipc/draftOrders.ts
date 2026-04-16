import { ipcMain } from 'electron'
import * as draftOrderService from '../services/draftOrderService'
import { getLocalIp } from '../server/expressApp'

export function registerDraftOrderHandlers() {
  ipcMain.handle('draftOrders:list', async () => {
    try {
      const data = draftOrderService.listPending()
      return { ok: true, data }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })

  ipcMain.handle('draftOrders:process', async (_event, id: number) => {
    try {
      draftOrderService.updateStatus(id, 'procesada')
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })

  ipcMain.handle('draftOrders:cancel', async (_event, id: number) => {
    try {
      draftOrderService.updateStatus(id, 'cancelada')
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })

  ipcMain.handle('draftOrders:getServerConfig', async () => {
    return { 
      ip: getLocalIp(),
      port: 3001,
      url: `http://${getLocalIp()}:3001`
    }
  })
}
