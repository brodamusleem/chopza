import { useEffect, useState } from 'react'
import { requireSupabase } from '@/shared/lib/supabaseClient'
import type { MenuItem, Vendor } from '../types'
export function useVendorMenu(id: string) {
  const [vendor, setVendor] = useState<Vendor>()
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    let active = true
    async function load() {
      const client = requireSupabase()
      const { data: row, error } = await client.from('vendors').select('id, name, description, logo_url, address, service_area_id').eq('id', id).eq('status', 'approved').maybeSingle()
      if (error) throw error
      if (!row) { if (active) setIsLoading(false); return }
      const { data: menu, error: menuError } = await client.from('menu_items').select('id, vendor_id, name, description, price, is_available').eq('vendor_id', id).eq('is_available', true).order('name')
      if (menuError) throw menuError
      if (active) {
        setVendor({ id: row.id, name: row.name, description: row.description, logoUrl: row.logo_url, area: row.address })
        setItems((menu ?? []).map((item) => ({ id: item.id, vendorId: item.vendor_id, name: item.name, description: item.description ?? '', priceKobo: Number(item.price) * 100, available: item.is_available })))
        setIsLoading(false)
      }
    }
    void load().catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause : new Error('Unable to load vendor details.'))
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [id])
  return { vendor, items, isLoading, error }
}
