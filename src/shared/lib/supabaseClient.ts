import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
// Missing configuration is a supported setup state, never a fake session.
export const supabase =
  url && key?.startsWith('sb_publishable_')
    ? createClient<Database>(url, key)
    : null

export function requireSupabase() {
  if (!supabase)
    throw new Error(
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to connect Supabase.',
    )
  return supabase
}
