import { create } from 'zustand'
import type { CartItem, DiscountType } from '../types'

interface CartState {
  items: CartItem[]
  generalDiscountType: DiscountType
  generalDiscountValue: number
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  setItemDiscount: (productId: number, discountType: DiscountType, discountValue: number) => void
  setGeneralDiscount: (discountType: DiscountType, discountValue: number) => void
  clear: () => void
  getSubtotal: () => number
  getSubtotalWithDiscounts: () => number
  getGeneralDiscountTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  generalDiscountType: null,
  generalDiscountValue: 0,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
              : i
          )
        }
      }
      return {
        items: [
          ...state.items,
          {
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            stock: item.stock,
            quantity: item.quantity ?? 1
          }
        ]
      }
    })
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    }))
  },

  setItemDiscount: (productId, discountType, discountValue) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, discountType, discountValue } : i
      )
    }))
  },

  setGeneralDiscount: (discountType, discountValue) => {
    set({ generalDiscountType: discountType, generalDiscountValue: discountValue })
  },

  clear: () => set({ items: [], generalDiscountType: null, generalDiscountValue: 0 }),

  getSubtotal: () => {
    return get().items.reduce((sum, i) => {
      const gross = i.unitPrice * i.quantity
      let discount = 0
      if (i.discountType === 'porcentaje' && i.discountValue) {
        discount = gross * (i.discountValue / 100)
      } else if (i.discountType === 'monto' && i.discountValue) {
        discount = Math.min(i.discountValue, gross)
      }
      return sum + (gross - discount)
    }, 0)
  },

  getGeneralDiscountTotal: () => {
    const { generalDiscountType, generalDiscountValue } = get()
    const subtotal = get().getSubtotal()
    if (generalDiscountType === 'porcentaje' && generalDiscountValue) {
      return subtotal * (generalDiscountValue / 100)
    } else if (generalDiscountType === 'monto' && generalDiscountValue) {
      return Math.min(generalDiscountValue, subtotal)
    }
    return 0
  },

  getSubtotalWithDiscounts: () => {
    return get().getSubtotal() - get().getGeneralDiscountTotal()
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0)
}))
