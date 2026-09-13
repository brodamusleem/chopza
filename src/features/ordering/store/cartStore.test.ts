import { beforeEach, describe, expect, it } from 'vitest'
import { groupCartByVendor, useCartStore } from './cartStore'
const meal = {
  menuItemId: 'rice',
  vendorId: 'a',
  vendorName: 'Kitchen A',
  name: 'Rice',
  unitPriceKobo: 250000,
}
beforeEach(() => useCartStore.getState().clear())
describe('multi-vendor cart', () => {
  it('keeps matching item IDs from different vendors separate and totals in kobo', () => {
    const { addItem } = useCartStore.getState()
    addItem(meal)
    addItem(meal)
    addItem({
      ...meal,
      vendorId: 'b',
      vendorName: 'Kitchen B',
      unitPriceKobo: 100000,
    })
    const groups = groupCartByVendor(useCartStore.getState().items)
    expect(groups).toHaveLength(2)
    expect(groups[0].subtotalKobo).toBe(500000)
    expect(groups[1].subtotalKobo).toBe(100000)
    expect(groups[0].items[0].quantity).toBe(2)
  })
  it('removes only the selected vendor item when quantity reaches zero', () => {
    const { addItem, setQuantity } = useCartStore.getState()
    addItem(meal)
    addItem({ ...meal, vendorId: 'b' })
    setQuantity('a', 'rice', 0)
    expect(useCartStore.getState().items.map((item) => item.vendorId)).toEqual([
      'b',
    ])
  })
  it('rejects invalid prices and quantities without corrupting the cart', () => {
    const { addItem, setQuantity } = useCartStore.getState()
    expect(() => addItem({ ...meal, unitPriceKobo: -1 })).toThrow()
    expect(() => addItem({ ...meal, unitPriceKobo: 10.5 })).toThrow()
    addItem(meal)
    expect(() => setQuantity('a', 'rice', 1.5)).toThrow()
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })
})
