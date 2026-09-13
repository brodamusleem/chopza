export type CartItem = {
  menuItemId: string
  vendorId: string
  vendorName: string
  name: string
  unitPriceKobo: number
  quantity: number
}
export type VendorCart = {
  vendorId: string
  vendorName: string
  items: CartItem[]
  subtotalKobo: number
}
