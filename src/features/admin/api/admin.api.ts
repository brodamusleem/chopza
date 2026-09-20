import type {
  AdminOrder,
  AdminVendor,
  DashboardStats,
  OrderFilters,
  OrdersPerDay,
  VendorFilters,
} from '../types'
import { requireSupabase } from '@/shared/lib/supabaseClient'
import { dayKey, nextDay, startOfLagosDay, sevenDayKeys } from '../lib/dates'

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export async function getPendingVendors(): Promise<AdminVendor[]> {
  return getAllVendors({ status: 'pending' })
}

async function setVendorStatus(
  vendorId: string,
  status: 'approved' | 'rejected' | 'suspended',
): Promise<void> {
  const { error } = await requireSupabase()
    .from('vendors')
    .update({ status })
    .eq('id', vendorId)
  throwOnError(error)
}

export async function approveVendor(vendorId: string): Promise<void> {
  return setVendorStatus(vendorId, 'approved')
}

export async function rejectVendor(vendorId: string): Promise<void> {
  return setVendorStatus(vendorId, 'rejected')
}

export async function suspendVendor(vendorId: string): Promise<void> {
  return setVendorStatus(vendorId, 'suspended')
}

export type AdminVendorDetail = {
  id: string
  ownerId: string
  name: string
  description: string | null
  address: string
  serviceArea: string | null
  logoUrl: string | null
  latitude: number | null
  longitude: number | null
  status: AdminVendor['status']
  createdAt: string
  ownerName: string | null
  ownerEmail: string | null
  ownerPhone: string | null
}

export async function getVendorDetail(vendorId: string): Promise<AdminVendorDetail | null> {
  const { data, error } = await requireSupabase()
    .from('vendors')
    .select('id, owner_id, name, description, address, service_area_id, logo_url, latitude, longitude, status, created_at, profiles(full_name, phone), service_areas(name)')
    .eq('id', vendorId)
    .maybeSingle() as unknown as {
      data: {
        id: string
        owner_id: string
        name: string
        description: string | null
        address: string
        logo_url: string | null
        latitude: number | null
        longitude: number | null
        status: AdminVendor['status']
        created_at: string
        profiles: { full_name: string | null; phone: string | null } | null
        service_areas: { name: string } | null
      } | null
      error: { message: string } | null
    }
  throwOnError(error)
  if (!data) return null
  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    description: data.description,
    address: data.address,
    serviceArea: data.service_areas?.name ?? null,
    logoUrl: data.logo_url,
    latitude: data.latitude,
    longitude: data.longitude,
    status: data.status,
    createdAt: data.created_at,
    ownerName: data.profiles?.full_name ?? null,
    ownerEmail: null,
    ownerPhone: data.profiles?.phone ?? null,
  }
}

export async function getAllVendors(
  filters: VendorFilters = {},
): Promise<AdminVendor[]> {
  let query = requireSupabase()
    .from('vendors')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false })
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search?.trim()) query = query.ilike('name', `%${filters.search.trim()}%`)
  const { data, error } = await query
  throwOnError(error)
  return (data ?? []).map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    status: vendor.status,
    createdAt: vendor.created_at,
  }))
}

export async function getRecentOrders(
  filters: OrderFilters = {},
): Promise<AdminOrder[]> {
  let query = requireSupabase()
    .from('orders')
    .select(
      'id, total_amount, status, created_at, customer:profiles!orders_customer_id_fkey(full_name), vendor:vendors(name)',
    )
    .order('created_at', { ascending: false })
    .limit(100)
  if (filters.status) query = query.eq('status', filters.status as never)
  if (filters.from) query = query.gte('created_at', startOfLagosDay(filters.from))
  if (filters.to) query = query.lt('created_at', startOfLagosDay(nextDay(filters.to)))
  const { data, error } = await query
  throwOnError(error)
  return (data ?? []).map((order) => ({
    id: order.id,
    customer: order.customer?.full_name ?? 'Unknown customer',
    vendor: order.vendor?.name ?? 'Unknown vendor',
    totalAmount: order.total_amount,
    status: order.status,
    createdAt: order.created_at,
  }))
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = dayKey(new Date())
  const [vendors, pendingVendors, ordersToday, inTransit] = await Promise.all([
    requireSupabase().from('vendors').select('id', { count: 'exact', head: true }),
    requireSupabase()
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    requireSupabase()
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfLagosDay(today))
      .lt('created_at', startOfLagosDay(nextDay(today))),
    requireSupabase()
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['rider_assigned', 'picked_up', 'in_transit']),
  ])
  ;[vendors, pendingVendors, ordersToday, inTransit].forEach(({ error }) =>
    throwOnError(error),
  )
  return {
    totalVendors: vendors.count ?? 0,
    pendingVendors: pendingVendors.count ?? 0,
    ordersToday: ordersToday.count ?? 0,
    inTransit: inTransit.count ?? 0,
  }
}

export async function getOrdersPerDay(): Promise<OrdersPerDay> {
  const keys = sevenDayKeys()
  const { data, error } = await requireSupabase()
    .from('orders')
    .select('created_at')
    .gte('created_at', startOfLagosDay(keys[0]))
    .lt('created_at', startOfLagosDay(nextDay(keys.at(-1)!)))
  throwOnError(error)
  const counts = new Map(keys.map((key) => [key, 0]))
  ;(data ?? []).forEach((order) => {
    const key = dayKey(new Date(order.created_at))
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return keys.map((date) => ({
    date,
    label: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Africa/Lagos',
    }).format(new Date(`${date}T12:00:00Z`)),
    orders: counts.get(date) ?? 0,
  }))
}
