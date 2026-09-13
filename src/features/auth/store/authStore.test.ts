import { describe, expect, it } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { useAuthStore } from './authStore'
function session(appRole?: string, userRole?: string): Session {
  return {
    access_token: 'test',
    refresh_token: 'test',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'test',
      aud: 'authenticated',
      created_at: '',
      app_metadata: { role: appRole },
      user_metadata: { role: userRole },
    },
  }
}
describe('role trust boundary', () => {
  it('ignores editable user metadata', () => {
    useAuthStore.getState().setSession(session(undefined, 'admin'))
    expect(useAuthStore.getState().role).toBeNull()
  })
  it('accepts only known server-managed roles and clears them on logout', () => {
    useAuthStore.getState().setSession(session('vendor'))
    expect(useAuthStore.getState().role).toBe('vendor')
    useAuthStore.getState().setSession(session('superuser'))
    expect(useAuthStore.getState().role).toBeNull()
    useAuthStore.getState().setSession(null)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
