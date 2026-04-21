import { contextBridge, ipcRenderer } from 'electron'
import type { CompleteSaleInput } from '../main/utils/validators'

const api = {
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (data: any) => ipcRenderer.invoke('categories:create', data),
    update: (data: any) => ipcRenderer.invoke('categories:update', data),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id)
  },
  products: {
    list: (filters?: any) => ipcRenderer.invoke('products:list', filters),
    getById: (id: number) => ipcRenderer.invoke('products:getById', id),
    create: (data: any) => ipcRenderer.invoke('products:create', data),
    update: (data: any) => ipcRenderer.invoke('products:update', data),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
    search: (query: string) => ipcRenderer.invoke('products:search', query),
    adjustStock: (data: any) => ipcRenderer.invoke('products:adjustStock', data),
    lowStock: () => ipcRenderer.invoke('products:lowStock'),
    bulkPricePreview: (filters: any, adjustment: any) =>
      ipcRenderer.invoke('products:bulkPricePreview', filters, adjustment),
    bulkPriceApply: (updates: any) => ipcRenderer.invoke('products:bulkPriceApply', updates),
    lookup: (barcode: string) => ipcRenderer.invoke('products:lookup', barcode),
    identifyByImage: (base64Image: string) => ipcRenderer.invoke('products:identifyByImage', base64Image)
  },
  sales: {
    complete: (data: CompleteSaleInput) => ipcRenderer.invoke('sales:complete', data),
    list: (filters?: any) => ipcRenderer.invoke('sales:list', filters),
    getById: (id: number) => ipcRenderer.invoke('sales:getById', id),
    cancel: (data: any) => ipcRenderer.invoke('sales:cancel', data),
    dailySummary: (date?: string) => ipcRenderer.invoke('sales:dailySummary', date),
    topProducts: (limit?: number, from?: string, to?: string) =>
      ipcRenderer.invoke('sales:topProducts', limit, from, to),
    profitability: (saleId: number) => ipcRenderer.invoke('sales:profitability', saleId)
  },
  customers: {
    list: (filters?: any) => ipcRenderer.invoke('customers:list', filters),
    getById: (id: number) => ipcRenderer.invoke('customers:getById', id),
    create: (data: any) => ipcRenderer.invoke('customers:create', data),
    update: (data: any) => ipcRenderer.invoke('customers:update', data),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id)
  },
  suppliers: {
    list: (filters?: any) => ipcRenderer.invoke('suppliers:list', filters),
    getById: (id: number) => ipcRenderer.invoke('suppliers:getById', id),
    create: (data: any) => ipcRenderer.invoke('suppliers:create', data),
    update: (data: any) => ipcRenderer.invoke('suppliers:update', data),
    delete: (id: number) => ipcRenderer.invoke('suppliers:delete', id)
  },
  users: {
    list: () => ipcRenderer.invoke('users:list'),
    getById: (id: number) => ipcRenderer.invoke('users:getById', id),
    create: (data: any) => ipcRenderer.invoke('users:create', data),
    update: (data: any) => ipcRenderer.invoke('users:update', data),
    delete: (id: number) => ipcRenderer.invoke('users:delete', id),
    authenticate: (name: string, pin: string) => ipcRenderer.invoke('users:authenticate', name, pin),
    changePin: (data: any) => ipcRenderer.invoke('users:changePin', data)
  },
  businesses: {
    list: () => ipcRenderer.invoke('businesses:list'),
    listByUser: (userId: number, role: string) => ipcRenderer.invoke('businesses:listByUser', userId, role),
    create: (data: any) => ipcRenderer.invoke('businesses:create', data)
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    setBatch: (entries: Record<string, string>) => ipcRenderer.invoke('settings:setBatch', entries)
  },
  dashboard: {
    kpis: () => ipcRenderer.invoke('dashboard:kpis'),
    cashFlow: () => ipcRenderer.invoke('dashboard:cashFlow'),
    salesChart: (days?: number) => ipcRenderer.invoke('dashboard:salesChart', days),
    topProducts: (limit?: number) => ipcRenderer.invoke('dashboard:topProducts', limit),
    recentSales: (limit?: number) => ipcRenderer.invoke('dashboard:recentSales', limit)
  },
  purchaseOrders: {
    list: (filters?: any) => ipcRenderer.invoke('purchaseOrders:list', filters),
    getById: (id: number) => ipcRenderer.invoke('purchaseOrders:getById', id),
    create: (data: any) => ipcRenderer.invoke('purchaseOrders:create', data),
    update: (data: any) => ipcRenderer.invoke('purchaseOrders:update', data),
    updateStatus: (data: any) => ipcRenderer.invoke('purchaseOrders:updateStatus', data),
    cancel: (id: number) => ipcRenderer.invoke('purchaseOrders:cancel', id)
  },
  cashRegister: {
    open: (data: any) => ipcRenderer.invoke('cashRegister:open', data),
    current: () => ipcRenderer.invoke('cashRegister:current'),
    close: (data: any) => ipcRenderer.invoke('cashRegister:close', data),
    list: (limit?: number) => ipcRenderer.invoke('cashRegister:list', limit),
    liveSnapshot: () => ipcRenderer.invoke('cashRegister:liveSnapshot'),
    addCash: (data: { id: number; amount: number; notes?: string }) => ipcRenderer.invoke('cashRegister:addCash', data),
    movements: (filters?: any) => ipcRenderer.invoke('cashRegister:movements', filters)
  },
  reports: {
    byPeriod: (from: string, to: string, groupBy?: string) =>
      ipcRenderer.invoke('reports:byPeriod', from, to, groupBy),
    byProduct: (from: string, to: string) => ipcRenderer.invoke('reports:byProduct', from, to),
    byPaymentMethod: (from: string, to: string) =>
      ipcRenderer.invoke('reports:byPaymentMethod', from, to),
    byCustomer: (from: string, to: string) => ipcRenderer.invoke('reports:byCustomer', from, to),
    profit: (from: string, to: string) => ipcRenderer.invoke('reports:profit', from, to)
  },
  goodsReceipts: {
    receive: (data: any) => ipcRenderer.invoke('goodsReceipts:receive', data),
    receiveWithoutPO: (data: any) => ipcRenderer.invoke('goodsReceipts:receiveWithoutPO', data),
    pendingOrders: () => ipcRenderer.invoke('goodsReceipts:pendingOrders'),
    list: (filters?: any) => ipcRenderer.invoke('goodsReceipts:list', filters),
    getById: (id: number) => ipcRenderer.invoke('goodsReceipts:getById', id)
  },
  supplierScorecard: {
    get: (supplierId: number) => ipcRenderer.invoke('supplierScorecard:get', supplierId),
    ranking: () => ipcRenderer.invoke('supplierScorecard:ranking')
  },
  pulse: {
    getAlerts: () => ipcRenderer.invoke('pulse:getAlerts')
  },
  contextual: {
    getSuggestions: (limit?: number) => ipcRenderer.invoke('contextual:getSuggestions', limit)
  },
  draftOrders: {
    list: () => ipcRenderer.invoke('draftOrders:list'),
    process: (id: number) => ipcRenderer.invoke('draftOrders:process', id),
    cancel: (id: number) => ipcRenderer.invoke('draftOrders:cancel', id),
    getServerConfig: () => ipcRenderer.invoke('draftOrders:getServerConfig')
  },
  pricing: {
    getSuggestions: () => ipcRenderer.invoke('pricing:getSuggestions')
  },
  hardware: {
    readScale: () => ipcRenderer.invoke('hardware:readScale')
  },
  customerInsight: {
    profile: (customerId: number) => ipcRenderer.invoke('customerInsight:profile', customerId),
    generateMessage: (customerId: number) => ipcRenderer.invoke('customerInsight:generateMessage', customerId),
    atRisk: () => ipcRenderer.invoke('customerInsight:atRisk'),
    segmentation: () => ipcRenderer.invoke('customerInsight:segmentation')
  },
  autopilot: {
    preview: (coverageDays?: number) => ipcRenderer.invoke('autopilot:preview', coverageDays),
    generate: (userId: number | null, coverageDays?: number) =>
      ipcRenderer.invoke('autopilot:generate', userId, coverageDays)
  },
  supplierProducts: {
    list: (supplierId: number) => ipcRenderer.invoke('supplierProducts:list', supplierId),
    listByProduct: (productId: number) => ipcRenderer.invoke('supplierProducts:listByProduct', productId),
    add: (data: any) => ipcRenderer.invoke('supplierProducts:add', data),
    remove: (supplierId: number, productId: number) => ipcRenderer.invoke('supplierProducts:remove', supplierId, productId),
    cheapest: (productIds: number[]) => ipcRenderer.invoke('supplierProducts:cheapest', productIds),
    downloadTemplate: () => ipcRenderer.invoke('supplierProducts:downloadTemplate'),
    exportCatalog: (supplierId: number, supplierName: string) =>
      ipcRenderer.invoke('supplierProducts:exportCatalog', supplierId, supplierName),
    importXlsx: (supplierId: number) => ipcRenderer.invoke('supplierProducts:importXlsx', supplierId)
  },
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: () => ipcRenderer.invoke('backup:restore')
  },
  export: {
    products: () => ipcRenderer.invoke('export:products'),
    sales: (from?: string, to?: string) => ipcRenderer.invoke('export:sales', from, to),
    customers: () => ipcRenderer.invoke('export:customers')
  },
  customerAccount: {
    get: (customerId: number) => ipcRenderer.invoke('customerAccount:get', customerId),
    getBalance: (customerId: number) => ipcRenderer.invoke('customerAccount:getBalance', customerId),
    charge: (data: any) => ipcRenderer.invoke('customerAccount:charge', data),
    payment: (data: any) => ipcRenderer.invoke('customerAccount:payment', data),
    updateLimit: (customerId: number, creditLimit: number) =>
      ipcRenderer.invoke('customerAccount:updateLimit', customerId, creditLimit),
    debtors: () => ipcRenderer.invoke('customerAccount:debtors'),
    totalDebt: () => ipcRenderer.invoke('customerAccount:totalDebt')
  },
  ai: {
    ask: (prompt: string, history?: {role: 'user'|'model', content: string}[]) => ipcRenderer.invoke('ai:ask', prompt, history),
    analyze: (question: string) => ipcRenderer.invoke('ai:analyze', question),
    resetClient: () => ipcRenderer.invoke('ai:resetClient')
  },
  mp: {
    login: () => ipcRenderer.invoke('mp:login')
  },
  afip: {
    getServerStatus: () => ipcRenderer.invoke('afip:getServerStatus'),
    createVoucher: (data: any) => ipcRenderer.invoke('afip:createVoucher', data),
    getIvaTypes: () => ipcRenderer.invoke('afip:getIvaTypes'),
    getDocumentTypes: () => ipcRenderer.invoke('afip:getDocumentTypes')
  }
}

contextBridge.exposeInMainWorld('api', api)

contextBridge.exposeInMainWorld('electronNav', {
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (_e, path) => callback(path))
    return () => { ipcRenderer.removeAllListeners('navigate') }
  }
})

export type ApiType = typeof api
export type ElectronNavType = {
  onNavigate: (callback: (path: string) => void) => () => void
}
