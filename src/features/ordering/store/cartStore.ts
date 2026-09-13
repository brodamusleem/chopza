import { create } from 'zustand'
import type { CartItem, VendorCart } from '../types'
type CartState = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  setQuantity: (vendorId: string, menuItemId: string, quantity: number) => void
  removeItem: (vendorId: string, menuItemId: string) => void
  clear: () => void
}
export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) => {
    if (!Number.isSafeInteger(item.unitPriceKobo) || item.unitPriceKobo < 0)
      throw new Error('Price must be a non-negative integer in kobo.')
    set(({ items }) => {
      const existing = items.find(
        (entry) =>
          entry.vendorId === item.vendorId &&
          entry.menuItemId === item.menuItemId,
      )
      return {
        items: existing
          ? items.map((entry) =>
              entry === existing
                ? { ...entry, quantity: Math.min(99, entry.quantity + 1) }
                : entry,
            )
          : [...items, { ...item, quantity: 1 }],
      }
    })
  },
  setQuantity: (vendorId, menuItemId, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
      throw new Error('Quantity must be between 0 and 99.')
    set(({ items }) => ({
      items: items
        .map((item) =>
          item.vendorId === vendorId && item.menuItemId === menuItemId
            ? { ...item, quantity }
            : item,
        )
        .filter((item) => item.quantity > 0),
    }))
  },
  removeItem: (vendorId, menuItemId) =>
    set(({ items }) => ({
      items: items.filter(
        (item) => item.vendorId !== vendorId || item.menuItemId !== menuItemId,
      ),
    })),
  clear: () => set({ items: [] }),
}))
export function groupCartByVendor(items: CartItem[]): VendorCart[] {
  const groups = new Map<string, VendorCart>()
  for (const item of items) {
    const group = groups.get(item.vendorId) ?? {
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      items: [],
      subtotalKobo: 0,
    }
    group.items.push(item)
    group.subtotalKobo += item.unitPriceKobo * item.quantity
    groups.set(item.vendorId, group)
  }
  return [...groups.values()]
}
