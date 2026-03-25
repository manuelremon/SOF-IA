import type { ApiType, ElectronNavType } from '../../electron/preload/index'

declare global {
  interface Window {
    api: ApiType
    electronNav: ElectronNavType
  }
}
