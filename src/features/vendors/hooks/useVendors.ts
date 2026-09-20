import { useEffect, useState } from 'react'
import { getApprovedVendors } from '../api/vendors.api'
import type { Vendor } from '../types'
export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    let active = true
    getApprovedVendors()
      .then((data) => { if (active) setVendors(data) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause : new Error('Unable to load restaurants.')) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])
  return { vendors, isLoading, error }
}
