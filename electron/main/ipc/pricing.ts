import { ipcMain } from 'electron'
import * as dynamicPricingService from '../services/dynamicPricingService'

export function registerDynamicPricingHandlers() {
  ipcMain.handle('pricing:getSuggestions', async () => {
    try {
      const data = dynamicPricingService.getDiscountSuggestions()
      return { ok: true, data }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })
}
