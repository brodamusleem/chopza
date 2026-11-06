import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
// Supabase accepts both newer `sb_publishable_...` keys and legacy anon JWT
// keys. Validate that both values exist, not a particular key generation.
export const supabase =
  url && key
    ? createClient<Database>(url, key)
    : null

export function requireSupabase() {
  if (!supabase)
    throw new Error(
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to connect Supabase.',
    )
  return supabase
}
