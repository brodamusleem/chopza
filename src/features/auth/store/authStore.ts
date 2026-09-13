import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { isRole } from '@/shared/constants/roles'
import type { AuthState } from '../types'
export const useAuthStore = create<
  AuthState & {
    setSession: (session: Session | null) => void
    setError: (error: string) => void
  }
>((set) => ({
  user: null,
  session: null,
  role: null,
  ready: false,
  error: null,
  setSession: (session) => {
    // app_metadata is server-managed; user_metadata is NOT an authorization source.
    const role: unknown = session?.user.app_metadata.role
    set({
      session,
      user: session?.user ?? null,
      role: isRole(role) ? role : null,
      ready: true,
      error: null,
    })
  },
  setError: (error) =>
    set({ user: null, session: null, role: null, ready: true, error }),
}))
