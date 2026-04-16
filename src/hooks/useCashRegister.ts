import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'

export function useCashRegister() {
  const [currentRegister, setCurrentRegister] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [snapshot, setSnapshot] = useState<any>(null)
  
  const [movementsData, setMovementsData] = useState<any[]>([])
  const [movementFilters, setMovementFilters] = useState({
    type: 'todos',
    from: dayjs().format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  })

  const [suggestions, setSuggestions] = useState<any[]>([])
  const [pricingSuggestions, setPricingSuggestions] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [serverConfig, setServerConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadSuggestions = async () => {
    const res = await window.api.contextual.getSuggestions(8)
    if (res.ok) setSuggestions(res.data)
  }

  const loadPricingSuggestions = async () => {
    const res = await window.api.pricing.getSuggestions()
    if (res.ok) setPricingSuggestions(res.data)
  }

  const loadDrafts = async () => {
    const res = await window.api.draftOrders.list()
    if (res.ok) setDrafts(res.data)
  }

  const loadServerConfig = async () => {
    const cfg = await window.api.draftOrders.getServerConfig()
    setServerConfig(cfg)
  }

  const refreshSnapshot = async (): Promise<void> => {
    const r = await window.api.cashRegister.liveSnapshot()
    if (r.ok && r.data) setSnapshot(r.data)
  }

  const loadMovementsData = useCallback(async (filters: any = movementFilters) => {
    setLoading(true)
    const res = await window.api.cashRegister.movements(filters)
    if (res.ok) setMovementsData(res.data)
    setLoading(false)
  }, [movementFilters])

  const loadData = async (): Promise<void> => {
    setLoading(true)
    const [resCurrent, resHistory] = await Promise.all([
      window.api.cashRegister.current(),
      window.api.cashRegister.list(20)
    ])
    if (resCurrent.ok) setCurrentRegister(resCurrent.data)
    if (resHistory.ok) setHistory(resHistory.data as any[])
    
    await Promise.all([
      loadSuggestions(),
      loadPricingSuggestions(),
      loadDrafts(),
      loadServerConfig()
    ])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Auto-refresh snapshot & drafts if register is open
  useEffect(() => {
    if (currentRegister) {
      refreshSnapshot()
      loadDrafts()
      const interval = setInterval(() => {
        refreshSnapshot()
        loadDrafts()
      }, 10000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [currentRegister])

  return {
    currentRegister,
    setCurrentRegister,
    history,
    snapshot,
    refreshSnapshot,
    movementsData,
    movementFilters,
    setMovementFilters,
    loadMovementsData,
    suggestions,
    pricingSuggestions,
    drafts,
    loadDrafts,
    serverConfig,
    loading,
    setLoading,
    loadData
  }
}
