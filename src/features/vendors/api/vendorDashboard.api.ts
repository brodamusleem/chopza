import { requireSupabase } from '@/shared/lib/supabaseClient'

export type VendorOrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'rider_assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
export type VendorOrder = {
  id: string
  status: VendorOrderStatus
  customerName: string
  totalAmount: number
  createdAt: string
  items: { name: string; quantity: number; unitPrice: number }[]
}
export type VendorMenuItem = { id: string; name: string; description: string | null; price: number; imageUrl: string | null; category: string | null; available: boolean }

function errorMessage(error: { message: string } | null) { if (error) throw new Error(error.message) }

export async function getVendorId(ownerId: string) {
  const { data, error } = await requireSupabase().from('vendors').select('id').eq('owner_id', ownerId).maybeSingle()
  errorMessage(error)
  return data?.id ?? null
}

export async function getVendorStats(vendorId: string) {
  const client = requireSupabase()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [{ count: pending }, { data: orders }, { count: activeMenuItems }] = await Promise.all([
    client.from('orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'pending'),
    client.from('orders').select('total_amount, status, created_at').eq('vendor_id', vendorId).gte('created_at', today.toISOString()),
    client.from('menu_items').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('is_available', true),
  ])
  const todayOrders = orders ?? []
  return { pendingOrders: pending ?? 0, todayOrders: todayOrders.length, todayRevenue: todayOrders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total_amount), 0), activeMenuItems: activeMenuItems ?? 0 }
}

export async function getVendorOrdersPerDay(vendorId: string) {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6)
  const { data, error } = await requireSupabase().from('orders').select('created_at').eq('vendor_id', vendorId).gte('created_at', start.toISOString())
  errorMessage(error)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index)
    const key = date.toLocaleDateString('en-CA')
    return { label: date.toLocaleDateString('en-NG', { weekday: 'short' }), orders: (data ?? []).filter((order) => new Date(order.created_at).toLocaleDateString('en-CA') === key).length }
  })
}

export async function getVendorOrders(vendorId: string, history: boolean): Promise<VendorOrder[]> {
  const statuses: VendorOrderStatus[] = history ? ['delivered', 'cancelled'] : ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'in_transit']
  const { data, error } = await requireSupabase().from('orders').select('id, status, total_amount, created_at, customer:profiles!orders_customer_id_fkey(full_name), order_items(quantity, unit_price, menu_item:menu_items(name))').eq('vendor_id', vendorId).in('status', statuses).order('created_at', { ascending: false })
  errorMessage(error)
  return (data ?? []).map((order) => ({ id: order.id, status: order.status as VendorOrderStatus, customerName: order.customer?.full_name ?? 'Customer', totalAmount: Number(order.total_amount), createdAt: order.created_at, items: (order.order_items ?? []).map((item) => ({ name: item.menu_item?.name ?? 'Menu item', quantity: item.quantity, unitPrice: Number(item.unit_price) })) }))
}

export async function addOrderStatusEvent(orderId: string, status: VendorOrderStatus, note?: string) {
  const { error } = await requireSupabase().from('order_status_events').insert({ order_id: orderId, status, note: note ?? null })
  errorMessage(error)
}

export async function getVendorMenu(vendorId: string): Promise<VendorMenuItem[]> {
  const { data, error } = await requireSupabase().from('menu_items').select('id, name, description, price, image_url, category, is_available').eq('vendor_id', vendorId).order('name')
  errorMessage(error)
  return (data ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description, price: Number(item.price), imageUrl: item.image_url, category: item.category, available: item.is_available }))
}

export async function saveVendorMenuItem(vendorId: string, values: { id?: string; name: string; description: string; price: number; category: string; imageUrl?: string | null }) {
  const payload = { vendor_id: vendorId, name: values.name, description: values.description || null, price: values.price, category: values.category || null, ...(values.imageUrl !== undefined ? { image_url: values.imageUrl } : {}) }
  const query = values.id ? requireSupabase().from('menu_items').update(payload).eq('id', values.id) : requireSupabase().from('menu_items').insert(payload)
  const { error } = await query
  errorMessage(error)
}

export async function setMenuAvailability(itemId: string, available: boolean) {
  const { error } = await requireSupabase().from('menu_items').update({ is_available: available }).eq('id', itemId)
  errorMessage(error)
}

export async function deleteMenuItem(itemId: string) {
  const { error } = await requireSupabase().from('menu_items').delete().eq('id', itemId)
  errorMessage(error)
}

export async function uploadMenuImage(vendorId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${vendorId}/${crypto.randomUUID()}.${extension}`
  const storage = requireSupabase().storage.from('menu-item-images')
  const { error } = await storage.upload(path, file, { upsert: true, contentType: file.type })
  errorMessage(error)
  return storage.getPublicUrl(path).data.publicUrl
}
