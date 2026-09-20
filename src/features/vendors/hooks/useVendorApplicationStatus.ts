import { useEffect, useState } from 'react'
import { getVendorApplication } from '../api/vendorOnboarding.api'
import { useAuth } from '@/features/auth'
import type { VendorApplication } from '../api/vendorOnboarding.api'

export function useVendorApplicationStatus() {
  const { user, role, ready } = useAuth()
  const [application, setApplication] = useState<VendorApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    if (!ready || role !== 'vendor' || !user) {
      setIsLoading(!ready)
      if (ready) {
        setApplication(null)
        setError(null)
      }
      return
    }
    let active = true
    const timeout = window.setTimeout(() => {
      if (active) {
        setIsLoading(false)
        setError(new Error('Vendor application lookup timed out. Check your Supabase connection and try again.'))
      }
    }, 10000)
    setApplication(null)
    setError(null)
    setIsLoading(true)
    getVendorApplication(user.id)
      .then((data) => {
        if (active) setApplication(data)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause : new Error('Unable to load your vendor application.'))
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [ready, role, user, refreshToken])

  return { application, status: application?.status ?? null, isLoading, error, refetch: () => setRefreshToken((value) => value + 1) }
}
