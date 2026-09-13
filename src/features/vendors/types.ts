export type Vendor = {
  id: string
  name: string
  cuisine: string
  area: string
  deliveryMinutes: number
}
export type MenuItem = {
  id: string
  vendorId: string
  name: string
  description: string
  priceKobo: number
  available: boolean
}
