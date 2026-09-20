import { requireSupabase } from '@/shared/lib/supabaseClient'
import type { VendorApplicationValues } from '../schemas/vendorApplication.schema'

export type ServiceArea = { id: string; name: string }
export type VendorApplication = VendorApplicationValues & {
  id: string
  owner_id: string
  is_open: boolean
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  logo_url: string | null
  created_at: string
}

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function getServiceAreas(): Promise<ServiceArea[]> {
  const { data, error } = await requireSupabase()
    .from('service_areas')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  throwOnError(error)
  return data ?? []
}

export async function getVendorApplication(userId: string) {
  const { data, error } = await requireSupabase()
    .from('vendors')
    .select('id, owner_id, name, description, address, service_area_id, latitude, longitude, logo_url, status, is_open, created_at')
    .eq('owner_id', userId)
    .maybeSingle()
  throwOnError(error)
  return data as VendorApplication | null
}

async function uploadLogo(userId: string, file: File | undefined) {
  if (!file) return null
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const storage = requireSupabase().storage.from('vendor-logos')
  const { error } = await storage.upload(path, file, { upsert: true, contentType: file.type })
  throwOnError(error)
  return storage.getPublicUrl(path).data.publicUrl
}

export async function createVendorApplication(
  userId: string,
  values: VendorApplicationValues,
  logo?: File,
) {
  const logoUrl = await uploadLogo(userId, logo)
  const { data, error } = await requireSupabase()
    .from('vendors')
    .insert({
      owner_id: userId,
      name: values.name,
      description: values.description || null,
      address: values.address,
      service_area_id: values.service_area_id,
      latitude: values.latitude,
      longitude: values.longitude,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    } as never)
    .select('id, owner_id, name, description, address, service_area_id, latitude, longitude, logo_url, status, is_open, created_at')
    .single()
  throwOnError(error)
  return data as VendorApplication
}

export async function updateVendorApplication(
  vendorId: string,
  userId: string,
  values: VendorApplicationValues,
  logo?: File,
) {
  const logoUrl = await uploadLogo(userId, logo)
  const { data, error } = await requireSupabase()
    .from('vendors')
    .update({
      name: values.name,
      description: values.description || null,
      address: values.address,
      service_area_id: values.service_area_id,
      latitude: values.latitude,
      longitude: values.longitude,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    } as never)
    .eq('id', vendorId)
    .select('id, owner_id, name, description, address, service_area_id, latitude, longitude, logo_url, status, is_open, created_at')
    .single()
  throwOnError(error)
  return data as VendorApplication
}

export async function resubmitVendorApplication(vendorId: string) {
  const { error } = await requireSupabase().rpc('resubmit_vendor_application' as never, {
    target_vendor_id: vendorId,
  } as never)
  throwOnError(error)
}

export async function updateVendorOpenStatus(vendorId: string, isOpen: boolean) {
  const { error } = await requireSupabase().from('vendors').update({ is_open: isOpen }).eq('id', vendorId)
  throwOnError(error)
}
