import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getActiveServiceAreas,
  getApprovedStorefrontVendors,
  getStorefrontSettings,
  type ActiveServiceArea,
  type StorefrontSettings,
  type StorefrontVendor,
} from './api'
import { useDeliveryArea, useDeliveryLocation } from './state'

type StorefrontContextValue = {
  areas: ActiveServiceArea[]
  settings: StorefrontSettings | null
  vendors: StorefrontVendor[]
  isLoading: boolean
  error: Error | null
  retry: () => void
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null)

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const areaId = useDeliveryArea((state) => state.areaId)
  const latitude = useDeliveryLocation((state) => state.latitude)
  const longitude = useDeliveryLocation((state) => state.longitude)
  const [areas, setAreas] = useState<ActiveServiceArea[]>([])
  const [settings, setSettings] = useState<StorefrontSettings | null>(null)
  const [vendors, setVendors] = useState<StorefrontVendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    Promise.all([getActiveServiceAreas(), getStorefrontSettings()])
      .then(([loadedAreas, loadedSettings]) => {
        if (!active) return
        setAreas(loadedAreas)
        setSettings(loadedSettings)
        if (areaId && !loadedAreas.some((area) => area.id === areaId))
          useDeliveryArea.getState().setAreaId(null)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause
              : new Error('Unable to load storefront settings.'),
          )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [retryCount])

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    getApprovedStorefrontVendors(latitude !== null && longitude !== null ? null : areaId)
      .then((loaded) => {
        if (!active) return
        if (latitude === null || longitude === null) {
          setVendors(loaded)
          return
        }
        const distanceFromCustomer = (vendorLatitude: number, vendorLongitude: number) => {
          const radians = (degrees: number) => (degrees * Math.PI) / 180
          const dLat = radians(vendorLatitude - latitude)
          const dLon = radians(vendorLongitude - longitude)
          const a = Math.sin(dLat / 2) ** 2
            + Math.cos(radians(latitude)) * Math.cos(radians(vendorLatitude)) * Math.sin(dLon / 2) ** 2
          return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        }
        const nearby = loaded.map((vendor) => ({
          ...vendor,
          distanceKm: vendor.latitude !== null && vendor.longitude !== null
            ? distanceFromCustomer(vendor.latitude, vendor.longitude)
            : null,
        }))
        nearby.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
        setVendors(nearby)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause
              : new Error('Unable to load restaurants.'),
          )
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [areaId, latitude, longitude, retryCount])

  const retry = useCallback(() => setRetryCount((value) => value + 1), [])
  const value = useMemo(
    () => ({ areas, settings, vendors, isLoading, error, retry }),
    [areas, settings, vendors, isLoading, error, retry],
  )
  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  )
}

export function useStorefront() {
  const context = useContext(StorefrontContext)
  if (!context)
    throw new Error('useStorefront must be used within StorefrontProvider')
  return context
}
