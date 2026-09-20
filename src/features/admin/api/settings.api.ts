import { requireSupabase } from '@/shared/lib/supabaseClient'
import type { Tables, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export type PlatformSettings = Tables<'platform_settings'>
export type ServiceArea = Tables<'service_areas'>
export type AdminProfile = Tables<'profiles'>

const supabase = () => requireSupabase()

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase().from('platform_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function updatePlatformSettings(values: TablesUpdate<'platform_settings'>) {
  const { data, error } = await supabase().from('platform_settings').update(values).eq('id', 1).select('*').single()
  if (error) throw error
  return data
}

export async function getAdminProfile(userId: string) {
  const { data, error } = await supabase().from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateAdminProfile(userId: string, values: TablesUpdate<'profiles'>) {
  const { data, error } = await supabase().from('profiles').update(values).eq('id', userId).select('*').single()
  if (error) throw error
  return data
}

export async function uploadPublicFile(bucket: string, path: string, file: File) {
  const { error } = await supabase().storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase().storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getServiceAreas() {
  const { data, error } = await supabase().from('service_areas').select('*').order('name')
  if (error) throw error
  return data
}

export async function createServiceArea(values: TablesInsert<'service_areas'>) {
  const { data, error } = await supabase().from('service_areas').insert(values).select('*').single()
  if (error) throw error
  return data
}

export async function updateServiceArea(id: string, values: TablesUpdate<'service_areas'>) {
  const { error } = await supabase().from('service_areas').update(values).eq('id', id)
  if (error) throw error
}

export async function deleteServiceArea(id: string) {
  const { error } = await supabase().from('service_areas').delete().eq('id', id)
  if (error) throw error
}

export async function getAdminProfiles() {
  const { data, error } = await supabase().from('profiles').select('*').eq('role', 'admin').order('created_at')
  if (error) throw error
  return data
}

export async function inviteAdmin(email: string, full_name: string) {
  const { data, error } = await supabase().functions.invoke('invite-admin', { body: { email, full_name } })
  if (error) throw error
  return data
}

export async function demoteAdmin(id: string) {
  return updateAdminProfile(id, { role: 'customer' })
}

export async function getExportRows(table: 'vendors' | 'orders') {
  const { data, error } = await supabase().from(table).select('*')
  if (error) throw error
  return data
}
