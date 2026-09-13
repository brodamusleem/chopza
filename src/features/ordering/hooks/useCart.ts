import { useMemo } from 'react'
import { groupCartByVendor, useCartStore } from '../store/cartStore'
export function useCart() {
  const store = useCartStore()
  const groups = useMemo(() => groupCartByVendor(store.items), [store.items])
  return {
    ...store,
    groups,
    totalKobo: groups.reduce((total, group) => total + group.subtotalKobo, 0),
  }
}
