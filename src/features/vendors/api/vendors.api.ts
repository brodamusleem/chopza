import { requireSupabase } from '@/shared/lib/supabaseClient'
import type { Vendor } from '../types'

export async function getApprovedVendors(): Promise<Vendor[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('vendors')
    .select('id, name, description, logo_url, address, service_area_id')
    .eq('status', 'approved')
    .order('name')
  if (error) throw error
  if (!data?.length) return []

  const areaIds = data
    .map((vendor) => vendor.service_area_id)
    .filter((id): id is string => Boolean(id))
  const { data: areas, error: areaError } = areaIds.length
    ? await client.from('service_areas').select('id, name').in('id', areaIds)
    : { data: [], error: null }
  if (areaError) throw areaError
  const areaNames = new Map((areas ?? []).map((area) => [area.id, area.name]))

  return data.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    description: vendor.description,
    logoUrl: vendor.logo_url,
    area: areaNames.get(vendor.service_area_id ?? '') ?? vendor.address,
  }))
}
