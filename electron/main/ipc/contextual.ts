import { ipcMain } from 'electron'
import * as contextualService from '../services/contextualService'

export function registerContextualHandlers() {
  ipcMain.handle('contextual:getSuggestions', async (_event, limit: number) => {
    try {
      const data = contextualService.getSuggestionsForCurrentTime(limit)
      return { ok: true, data }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })
}
