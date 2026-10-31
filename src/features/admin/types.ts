// Presentation models; the API maps generated database rows into these shapes.
export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected'
export type AdminVendor = {
  id: string
  name: string
  status: VendorStatus
  createdAt: string
}
export type VendorFilters = { status?: VendorStatus; search?: string }
export type RiderStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type AdminRider = {
  id: string
  name: string
  vehicleType: string
  plateNumber: string | null
  status: RiderStatus
  isOnline: boolean
  createdAt: string
}
export type RiderFilters = { status?: RiderStatus; search?: string }
export type OrderFilters = { status?: string; from?: string; to?: string }
export type AdminOrder = {
  id: string
  customer: string
  vendor: string
  totalAmount: number
  status: string
  createdAt: string
}
export type DashboardStats = {
  totalVendors: number
  pendingVendors: number
  totalRiders: number
  pendingRiders: number
  ordersToday: number
  inTransit: number
}
export type OrdersPerDay = { date: string; label: string; orders: number }[]
export type QueryResult<T> = {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}
