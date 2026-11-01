import type { Tables } from '@/shared/types/database.types'
import { requireSupabase } from '@/shared/lib/supabaseClient'

export type StorefrontVendor = Pick<
  Tables<'vendors'>,
  | 'id'
  | 'name'
  | 'description'
  | 'logo_url'
  | 'cover_url'
  | 'cuisine'
  | 'address'
  | 'service_area_id'
  | 'created_at'
  | 'is_open'
> & { areaName: string | null }

export type ActiveServiceArea = Pick<Tables<'service_areas'>, 'id' | 'name'>
export type StorefrontSettings = Pick<
  Tables<'platform_settings'>,
  'app_name' | 'logo_url' | 'base_delivery_fee'
>
export type SearchDish = Pick<
  Tables<'menu_items'>,
  'id' | 'name' | 'price' | 'vendor_id'
>

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function getActiveServiceAreas(): Promise<ActiveServiceArea[]> {
  const { data, error } = await requireSupabase()
    .from('service_areas')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  throwIfError(error)
  return data ?? []
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const { data, error } = await requireSupabase()
    .from('platform_settings')
    .select('app_name, logo_url, base_delivery_fee')
    .eq('id', 1)
    .single()
  throwIfError(error)
  if (!data) throw new Error('Storefront settings are not configured.')
  return data
}

export async function getApprovedStorefrontVendors(
  areaId: string | null,
): Promise<StorefrontVendor[]> {
  const client = requireSupabase()
  let query = client
    .from('vendors')
    .select(
      'id, name, description, logo_url, cover_url, cuisine, address, service_area_id, created_at, is_open',
    )
    .eq('status', 'approved')
    .order('name')
  if (areaId) query = query.eq('service_area_id', areaId)
  const { data, error } = await query
  throwIfError(error)
  const vendors = data ?? []
  const areaIds = [
    ...new Set(
      vendors
        .map((vendor) => vendor.service_area_id)
        .filter((id): id is string => id !== null),
    ),
  ]
  const { data: areas, error: areaError } = areaIds.length
    ? await client.from('service_areas').select('id, name').in('id', areaIds)
    : { data: [], error: null }
  throwIfError(areaError)
  const areaNames = new Map((areas ?? []).map((area) => [area.id, area.name]))
  return vendors.map((vendor) => ({
    ...vendor,
    areaName: areaNames.get(vendor.service_area_id ?? '') ?? null,
  }))
}

export async function getVendorById(vendorId: string) {
  const { data, error } = await requireSupabase()
    .from('vendors')
    .select(
      'id, name, description, logo_url, cover_url, cuisine, address, service_area_id, created_at, is_open',
    )
    .eq('id', vendorId)
    .eq('status', 'approved')
    .maybeSingle()
  throwIfError(error)
  if (!data) return null
  const area = data.service_area_id
    ? await requireSupabase()
        .from('service_areas')
        .select('name')
        .eq('id', data.service_area_id)
        .maybeSingle()
    : { data: null, error: null }
  throwIfError(area.error)
  return { ...data, areaName: area.data?.name ?? null }
}

export async function getAvailableDishes(
  query: string,
  vendorIds: string[],
  limit = 6,
): Promise<SearchDish[]> {
  if (!query.trim() || vendorIds.length === 0) return []
  const escaped = query.trim().replace(/[\\%_]/g, '\\$&')
  const { data, error } = await requireSupabase()
    .from('menu_items')
    .select('id, name, price, vendor_id')
    .in('vendor_id', vendorIds)
    .eq('is_available', true)
    .ilike('name', `%${escaped}%`)
    .order('name')
    .limit(limit)
  throwIfError(error)
  return data ?? []
}

export async function getFavoriteVendorIds(customerId: string) {
  const { data, error } = await requireSupabase()
    .from('favorites')
    .select('vendor_id')
    .eq('customer_id', customerId)
  throwIfError(error)
  return (data ?? []).map((row) => row.vendor_id)
}

export async function addFavorite(customerId: string, vendorId: string) {
  const { error } = await requireSupabase()
    .from('favorites')
    .insert({ customer_id: customerId, vendor_id: vendorId })
  throwIfError(error)
}

export async function removeFavorite(customerId: string, vendorId: string) {
  const { error } = await requireSupabase()
    .from('favorites')
    .delete()
    .eq('customer_id', customerId)
    .eq('vendor_id', vendorId)
  throwIfError(error)
}

export async function getMenuForVendor(vendorId: string) {
  const { data, error } = await requireSupabase()
    .from('menu_items')
    .select('id, vendor_id, name, description, price, image_url, category, is_available')
    .eq('vendor_id', vendorId)
    .order('name')
  throwIfError(error)
  return data ?? []
}
