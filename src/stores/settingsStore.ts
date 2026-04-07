import { create } from 'zustand'
import type { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings | null
  loading: boolean
  loadSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: true,
  loadSettings: async () => {
    try {
      const res = await window.api.settings.getAll()
      if (res.ok && res.data) {
        set({ settings: res.data as AppSettings, loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },
  updateSetting: async (key: string, value: string) => {
    const { settings } = get()
    if (!settings) return
    
    // Optimistic update
    const prev = { ...settings }
    set({ settings: { ...settings, [key]: value } })
    
    try {
      const res = await window.api.settings.set(key, value)
      if (!res.ok) {
        // Rollback
        set({ settings: prev })
      }
    } catch {
      set({ settings: prev })
    }
  }
}))
