import type { MenuItem, Vendor } from '../types'
// Explicit demo fixtures, never presented as live restaurants or database responses.
export const demoVendors: Vendor[] = [
  {
    id: 'kano-kitchen',
    name: 'Kano Kitchen',
    cuisine: 'Northern favourites',
    area: 'Nassarawa',
    deliveryMinutes: 30,
  },
  {
    id: 'savannah-grill',
    name: 'Savannah Grill',
    cuisine: 'Grills & rice',
    area: 'Tarauni',
    deliveryMinutes: 40,
  },
  {
    id: 'city-bites',
    name: 'City Bites',
    cuisine: 'Quick bites',
    area: 'Fagge',
    deliveryMinutes: 25,
  },
]
const demoMenu: MenuItem[] = [
  {
    id: 'tuwo',
    vendorId: 'kano-kitchen',
    name: 'Tuwo shinkafa & miyan kuka',
    description: 'A northern classic, freshly prepared.',
    priceKobo: 250000,
    available: true,
  },
  {
    id: 'masa',
    vendorId: 'kano-kitchen',
    name: 'Masa & pepper sauce',
    description: 'Soft rice cakes with a little heat.',
    priceKobo: 120000,
    available: true,
  },
  {
    id: 'suya',
    vendorId: 'savannah-grill',
    name: 'Beef suya',
    description: 'Spiced grilled beef with onions.',
    priceKobo: 300000,
    available: true,
  },
  {
    id: 'jollof',
    vendorId: 'savannah-grill',
    name: 'Jollof rice & chicken',
    description: 'Smoky rice with grilled chicken.',
    priceKobo: 350000,
    available: true,
  },
  {
    id: 'wrap',
    vendorId: 'city-bites',
    name: 'Chicken wrap',
    description: 'Chicken, fresh vegetables and house sauce.',
    priceKobo: 220000,
    available: true,
  },
]
export function getDemoMenu(vendorId: string) {
  return demoMenu.filter((item) => item.vendorId === vendorId)
}
