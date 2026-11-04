import { create } from 'zustand'

const AREA_STORAGE_KEY = 'chopza-delivery-area'

function readAreaId() {
  try {
    return localStorage.getItem(AREA_STORAGE_KEY)
  } catch {
    return null
  }
}

type AreaState = {
  areaId: string | null
  setAreaId: (areaId: string | null) => void
}

export const useDeliveryArea = create<AreaState>((set) => ({
  areaId: readAreaId(),
  setAreaId: (areaId) => {
    try {
      if (areaId) localStorage.setItem(AREA_STORAGE_KEY, areaId)
      else localStorage.removeItem(AREA_STORAGE_KEY)
    } catch {
      // The selection remains usable for this page even if storage is blocked.
    }
    set({ areaId })
  },
}))

const DELIVERY_LOCATION_KEY = 'chopza-delivery-location'

export type DeliveryLocation = {
  address: string
  latitude: number | null
  longitude: number | null
}

function readDeliveryLocation(): DeliveryLocation {
  try {
    const value = localStorage.getItem(DELIVERY_LOCATION_KEY)
    if (!value) return { address: '', latitude: null, longitude: null }
    const parsed = JSON.parse(value) as Partial<DeliveryLocation>
    return {
      address: typeof parsed.address === 'string' ? parsed.address : '',
      latitude: typeof parsed.latitude === 'number' ? parsed.latitude : null,
      longitude: typeof parsed.longitude === 'number' ? parsed.longitude : null,
    }
  } catch {
    return { address: '', latitude: null, longitude: null }
  }
}

type DeliveryLocationState = DeliveryLocation & {
  setLocation: (location: DeliveryLocation) => void
  clearLocation: () => void
}

export const useDeliveryLocation = create<DeliveryLocationState>((set) => ({
  ...readDeliveryLocation(),
  setLocation: (location) => {
    try {
      localStorage.setItem(DELIVERY_LOCATION_KEY, JSON.stringify(location))
    } catch {
      // Keep the current location available for this session if storage is blocked.
    }
    set(location)
  },
  clearLocation: () => {
    try {
      localStorage.removeItem(DELIVERY_LOCATION_KEY)
    } catch {
      // Keep the current page usable if storage is blocked.
    }
    set({ address: '', latitude: null, longitude: null })
  },
}))

type FavoriteState = {
  customerId: string | null
  vendorIds: string[]
  setFavorites: (customerId: string | null, vendorIds: string[]) => void
  setVendorIds: (vendorIds: string[]) => void
}

export const useFavoriteState = create<FavoriteState>((set) => ({
  customerId: null,
  vendorIds: [],
  setFavorites: (customerId, vendorIds) => set({ customerId, vendorIds }),
  setVendorIds: (vendorIds) => set({ vendorIds }),
}))
