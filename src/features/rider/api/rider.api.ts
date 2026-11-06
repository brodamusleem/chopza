import { requireSupabase } from '@/shared/lib/supabaseClient'

export type RiderApplication = {
  id: string
  owner_id: string
  vehicle_type: string
  plate_number: string | null
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  is_online: boolean
}
export type RiderOrderStatus =
  'rider_assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
export type RiderOrder = {
  id: string
  status: RiderOrderStatus
  created_at: string
  delivery_address: string
  total_amount: number
  rider_assigned_at: string | null
  rider_accepted_at: string | null
  vendor_name: string
  vendor_address: string
  items: { name: string; quantity: number }[]
}
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}
export async function getRiderApplication(ownerId: string) {
  const { data, error } = await requireSupabase()
    .from('riders')
    .select('id, owner_id, vehicle_type, plate_number, status, is_online')
    .eq('owner_id', ownerId)
    .maybeSingle()
  check(error)
  return data as RiderApplication | null
}
export async function createRiderApplication(
  ownerId: string,
  values: { vehicle_type: string; plate_number?: string },
) {
  const { error } = await requireSupabase()
    .from('riders')
    .insert({
      owner_id: ownerId,
      vehicle_type: values.vehicle_type,
      plate_number: values.plate_number || null,
    })
  check(error)
}
export async function updateRiderApplication(
  id: string,
  values: { vehicle_type: string; plate_number?: string },
) {
  const { error } = await requireSupabase()
    .from('riders')
    .update({
      vehicle_type: values.vehicle_type,
      plate_number: values.plate_number || null,
    })
    .eq('id', id)
  check(error)
}
export async function resubmitRiderApplication(id: string) {
  const { error } = await requireSupabase().rpc('resubmit_rider_application', {
    target_rider_id: id,
  })
  check(error)
}
export async function setRiderOnline(id: string, isOnline: boolean) {
  const { error } = await requireSupabase()
    .from('riders')
    .update({ is_online: isOnline })
    .eq('id', id)
  check(error)
}
export async function claimDelivery(orderId: string) {
  const { error } = await requireSupabase().rpc('claim_delivery', {
    target_order_id: orderId,
  })
  check(error)
}
export async function acceptDelivery(orderId: string) {
  const { error } = await requireSupabase().rpc('accept_delivery' as never, {
    target_order_id: orderId,
  } as never)
  check(error)
}
export async function declineDelivery(orderId: string) {
  const { error } = await requireSupabase().rpc('decline_delivery' as never, {
    target_order_id: orderId,
  } as never)
  check(error)
}
export async function addRiderStatusEvent(
  orderId: string,
  status: RiderOrderStatus,
) {
  const { error } = await requireSupabase()
    .from('order_status_events')
    .insert({ order_id: orderId, status })
  check(error)
}
export async function updateOrderLocation(
  orderId: string,
  lat: number,
  lng: number,
) {
  const { error } = await requireSupabase()
    .from('orders')
    .update({
      current_lat: lat,
      current_lng: lng,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
  check(error)
}
export async function getRiderHistory(
  ownerId: string,
  statuses: ('delivered' | 'cancelled')[],
  from?: string,
  to?: string,
) {
  let query = requireSupabase()
    .from('orders')
    .select(orderSelect)
    .eq('rider_id', ownerId)
    .in('status', statuses)
    .order('created_at', { ascending: false })
  if (from)
    query = query.gte('created_at', new Date(`${from}T00:00:00`).toISOString())
  if (to)
    query = query.lte(
      'created_at',
      new Date(`${to}T23:59:59.999`).toISOString(),
    )
  const { data, error } = await query
  check(error)
  return (data ?? []).map(mapOrder)
}
export async function getRiderProfile(ownerId: string) {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', ownerId)
    .maybeSingle()
  check(error)
  return data
}
export async function updateRiderProfile(
  ownerId: string,
  values: { full_name: string; phone: string; avatar_url: string },
) {
  const { error } = await requireSupabase()
    .from('profiles')
    .update({
      full_name: values.full_name,
      phone: values.phone || null,
      avatar_url: values.avatar_url || null,
    })
    .eq('id', ownerId)
  check(error)
}
function mapOrder(order: {
  id: string
  status: string
  created_at: string
  delivery_address: string
  total_amount: number
  rider_assigned_at: string | null
  rider_accepted_at: string | null
  vendor: { name: string; address: string } | null
  order_items: { quantity: number; menu_item: { name: string } | null }[] | null
}): RiderOrder {
  return {
    id: order.id,
    status: order.status as RiderOrderStatus,
    created_at: order.created_at,
    delivery_address: order.delivery_address,
    total_amount: Number(order.total_amount),
    rider_assigned_at: order.rider_assigned_at,
    rider_accepted_at: order.rider_accepted_at,
    vendor_name: order.vendor?.name ?? 'Vendor',
    vendor_address: order.vendor?.address ?? 'Pickup address unavailable',
    items: (order.order_items ?? []).map((item) => ({
      name: item.menu_item?.name ?? 'Menu item',
      quantity: item.quantity,
    })),
  }
}
const orderSelect =
  'id, status, created_at, delivery_address, total_amount, rider_assigned_at, rider_accepted_at, vendor:vendors(name, address), order_items(quantity, menu_item:menu_items(name))'
export async function getAvailableJobs() {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select(orderSelect)
    .eq('status', 'ready_for_pickup')
    .is('rider_id', null)
    .order('created_at')
  check(error)
  return (data ?? []).map(mapOrder)
}
export async function getRiderOrders(
  ownerId: string,
  statuses: RiderOrderStatus[],
) {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select(orderSelect)
    .eq('rider_id', ownerId)
    .in('status', statuses)
    .order('created_at', { ascending: false })
  check(error)
  return (data ?? []).map(mapOrder)
}
export async function getRiderDashboard(ownerId: string) {
  const client = requireSupabase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const week = new Date(today)
  week.setDate(week.getDate() - 6)
  const [todayResult, weekResult, settingsResult, active] = await Promise.all([
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('rider_id', ownerId)
      .eq('status', 'delivered')
      .gte('created_at', today.toISOString()),
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('rider_id', ownerId)
      .eq('status', 'delivered')
      .gte('created_at', week.toISOString()),
    client
      .from('platform_settings')
      .select('base_delivery_fee')
      .eq('id', 1)
      .single(),
    getRiderOrders(ownerId, ['rider_assigned', 'picked_up', 'in_transit']),
  ])
  check(todayResult.error)
  check(weekResult.error)
  check(settingsResult.error)
  return {
    today: todayResult.count ?? 0,
    week: weekResult.count ?? 0,
    fee: Number(settingsResult.data?.base_delivery_fee ?? 0),
    active: active[0],
  }
}
