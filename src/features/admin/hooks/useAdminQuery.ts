import { useCallback, useEffect, useRef, useState } from 'react'
/** Keep the query stable with useCallback when it depends on filters. */
export function useAdminQuery<T>(query: () => Promise<T>) {
  const [result, setResult] = useState<{
    data: T | undefined
    isLoading: boolean
    error: Error | null
  }>({ data: undefined, isLoading: true, error: null })
  const generation = useRef<symbol | null>(null)
  const mounted = useRef(false)
  const refetch = useCallback(async () => {
    const current = Symbol('admin-query')
    generation.current = current
    setResult((previous) => ({ ...previous, isLoading: true, error: null }))
    const timeout = window.setTimeout(() => {
      if (mounted.current && current === generation.current) {
        setResult((previous) => ({
          ...previous,
          isLoading: false,
          error: new Error('This request timed out. Check your Supabase connection and try again.'),
        }))
      }
    }, 10000)
    try {
      const data = await query()
      window.clearTimeout(timeout)
      if (mounted.current && current === generation.current)
        setResult({ data, isLoading: false, error: null })
    } catch (cause) {
      window.clearTimeout(timeout)
      if (mounted.current && current === generation.current)
        setResult((previous) => ({
          ...previous,
          isLoading: false,
          error:
            cause instanceof Error
              ? cause
              : new Error(
                  typeof cause === 'object' && cause && 'message' in cause
                    ? String(cause.message)
                    : 'Unable to load dashboard data.',
                ),
        }))
    }
  }, [query])
  useEffect(() => {
    mounted.current = true
    // Defer state updates and allow StrictMode's discarded effect to cancel.
    let active = true
    void Promise.resolve().then(() => {
      if (active) void refetch()
    })
    return () => {
      active = false
      mounted.current = false
      generation.current = null
    }
  }, [refetch])
  return { ...result, refetch }
}
