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
