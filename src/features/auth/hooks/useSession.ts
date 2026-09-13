import { useEffect } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuthStore } from '../store/authStore'
/** Mount once in AppProviders. Listener events supersede an older initial session read. */
export function useSession() {
  useEffect(() => {
    const { setSession, setError } = useAuthStore.getState()
    if (!supabase) {
      setSession(null)
      return
    }
    let active = true
    let eventReceived = false
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      eventReceived = true
      if (active) setSession(session)
    })
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || eventReceived) return
        if (error) setError(error.message)
        else setSession(data.session)
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
