import { ipcMain } from 'electron'
import { askAI, resetAIClient } from '../services/aiService'
import { askDatabase } from '../services/ragService'

export function setupAIHandlers() {
  ipcMain.handle('ai:ask', async (_, prompt: string, history?: { role: 'user' | 'model', content: string }[]) => {
    try {
      const response = await askAI(prompt, history || [])
      return { ok: true, data: { success: true, text: response } }
    } catch (error: any) {
      console.error('ai:ask handler error', error)
      return { ok: false, error: error.message || 'Error desconocido al invocar al Agente' }
    }
  })

  ipcMain.handle('ai:analyze', async (_, question: string) => {
    try {
      const response = await askDatabase(question)
      return { ok: true, data: { success: true, text: response } }
    } catch (error: any) {
      console.error('ai:analyze handler error', error)
      return { ok: false, error: error.message || 'Error al analizar el negocio' }
    }
  })

  ipcMain.handle('ai:resetClient', async () => {
    try {
      resetAIClient()
      return { ok: true }
    } catch (error: any) {
      console.error('ai:resetClient handler error', error)
      return { ok: false, error: error.message }
    }
  })
}
