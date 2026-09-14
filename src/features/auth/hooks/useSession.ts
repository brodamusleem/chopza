import { useEffect } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuthStore } from '../store/authStore'
import { getProfileRole } from '../api/auth.api'
/** Mount once in AppProviders. Listener events supersede an older initial session read. */
export function useSession() {
  useEffect(() => {
    const { setSession, setProfileRole, setError } = useAuthStore.getState()
    if (!supabase) {
      setSession(null)
      return
    }
    let active = true
    let eventReceived = false
    async function syncSession(session: Parameters<typeof setSession>[0]) {
      setSession(session)
      if (!session) return
      try {
        setProfileRole(await getProfileRole(session.user.id))
      } catch (error: unknown) {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : 'Profile initialization failed.',
          )
      }
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      eventReceived = true
      if (active) void syncSession(session)
    })
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || eventReceived) return
        if (error) setError(error.message)
        else void syncSession(data.session)
      })
      .catch((error: unknown) => {
        if (active && !eventReceived)
          setError(
            error instanceof Error
              ? error.message
              : 'Session initialization failed.',
          )
      })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])
}
