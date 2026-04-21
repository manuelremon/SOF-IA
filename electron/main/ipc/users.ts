import { ipcMain } from 'electron'
import * as userService from '../services/userService'

export function registerUserHandlers(): void {
  ipcMain.handle('users:list', async () => {
    try { return { ok: true, data: userService.listUsers() } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('users:getById', async (_e, id) => {
    try { return { ok: true, data: userService.getUserById(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('users:create', async (_e, data) => {
    try { return { ok: true, data: userService.createUser(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('users:update', async (_e, data) => {
    try { return { ok: true, data: userService.updateUser(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('users:delete', async (_e, id) => {
    try { return { ok: true, data: userService.deactivateUser(id) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('users:authenticate', async (_e, name, pin) => {
    try { return { ok: true, data: userService.authenticate(name, pin) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('users:changePin', async (_e, data) => {
    try { return { ok: true, data: userService.changePin(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('businesses:listByUser', async (_e, userId, role) => {
    try { return { ok: true, data: userService.listBusinessesByUser(userId, role) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
  ipcMain.handle('businesses:create', async (_e, data) => {
    try { return { ok: true, data: userService.createBusiness(data) } }
    catch (err: any) { return { ok: false, error: err.message } }
  })
}
