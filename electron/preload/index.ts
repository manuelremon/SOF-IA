import { contextBridge, ipcRenderer } from 'electron'

const api = {
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (data: unknown) => ipcRenderer.invoke('categories:create', data),
    update: (data: unknown) => ipcRenderer.invoke('categories:update', data),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id)
  },
  products: {
    list: (filters?: unknown) => ipcRenderer.invoke('products:list', filters),
    getById: (id: number) => ipcRenderer.invoke('products:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('products:create', data),
    update: (data: unknown) => ipcRenderer.invoke('products:update', data),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
    search: (query: string) => ipcRenderer.invoke('products:search', query),
    adjustStock: (data: unknown) => ipcRenderer.invoke('products:adjustStock', data),
    lowStock: () => ipcRenderer.invoke('products:lowStock')
  },
  sales: {
    complete: (data: unknown) => ipcRenderer.invoke('sales:complete', data),
    list: (filters?: unknown) => ipcRenderer.invoke('sales:list', filters),
    getById: (id: number) => ipcRenderer.invoke('sales:getById', id),
    cancel: (data: unknown) => ipcRenderer.invoke('sales:cancel', data),
    dailySummary: (date?: string) => ipcRenderer.invoke('sales:dailySummary', date),
    topProducts: (limit?: number, from?: string, to?: string) =>
      ipcRenderer.invoke('sales:topProducts', limit, from, to)
  },
  customers: {
    list: (filters?: unknown) => ipcRenderer.invoke('customers:list', filters),
    getById: (id: number) => ipcRenderer.invoke('customers:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('customers:create', data),
    update: (data: unknown) => ipcRenderer.invoke('customers:update', data),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id)
  },
  suppliers: {
    list: (filters?: unknown) => ipcRenderer.invoke('suppliers:list', filters),
    getById: (id: number) => ipcRenderer.invoke('suppliers:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('suppliers:create', data),
    update: (data: unknown) => ipcRenderer.invoke('suppliers:update', data),
    delete: (id: number) => ipcRenderer.invoke('suppliers:delete', id)
  },
  users: {
    list: () => ipcRenderer.invoke('users:list'),
    getById: (id: number) => ipcRenderer.invoke('users:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('users:create', data),
    update: (data: unknown) => ipcRenderer.invoke('users:update', data),
    authenticate: (name: string, pin: string) => ipcRenderer.invoke('users:authenticate', name, pin),
    changePin: (data: unknown) => ipcRenderer.invoke('users:changePin', data)
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    setBatch: (entries: Record<string, string>) => ipcRenderer.invoke('settings:setBatch', entries)
  },
  dashboard: {
    kpis: () => ipcRenderer.invoke('dashboard:kpis'),
    salesChart: (days?: number) => ipcRenderer.invoke('dashboard:salesChart', days),
    topProducts: (limit?: number) => ipcRenderer.invoke('dashboard:topProducts', limit),
    recentSales: (limit?: number) => ipcRenderer.invoke('dashboard:recentSales', limit)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
