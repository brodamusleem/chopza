export type Vendor = {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  area: string
}
export type MenuItem = {
  id: string
  vendorId: string
  name: string
  description: string
  priceKobo: number
  available: boolean
}
