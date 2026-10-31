import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import {
  addFavorite,
  getFavoriteVendorIds,
  removeFavorite,
} from './api'
import { useFavoriteState } from './state'

export function useLoadFavorites() {
  const { user } = useAuth()
  const setFavorites = useFavoriteState((state) => state.setFavorites)
  useEffect(() => {
    if (!user) {
      setFavorites(null, [])
      return
    }
    let active = true
    setFavorites(user.id, [])
    getFavoriteVendorIds(user.id)
      .then((ids) => active && setFavorites(user.id, ids))
      .catch((cause: unknown) => {
        if (active)
          toast.error(
            cause instanceof Error
              ? cause.message
              : 'Unable to load favourites.',
          )
      })
    return () => {
      active = false
    }
  }, [user?.id, setFavorites])
}

export function useFavoriteToggle() {
  const { user } = useAuth()
  const customerId = useFavoriteState((state) => state.customerId)
  const vendorIds = useFavoriteState((state) => state.vendorIds)
  const setVendorIds = useFavoriteState((state) => state.setVendorIds)

  async function toggle(vendorId: string) {
    if (!user) return false
    if (customerId !== user.id) {
      toast.error('Your favourites are still loading. Try again in a moment.')
      return false
    }
    const wasFavorite = vendorIds.includes(vendorId)
    setVendorIds(
      wasFavorite
        ? vendorIds.filter((id) => id !== vendorId)
        : [...vendorIds, vendorId],
    )
    try {
      if (wasFavorite) await removeFavorite(user.id, vendorId)
      else await addFavorite(user.id, vendorId)
      return true
    } catch (cause) {
      const latest = useFavoriteState.getState().vendorIds
      setVendorIds(
        wasFavorite
          ? [...new Set([...latest, vendorId])]
          : latest.filter((id) => id !== vendorId),
      )
      toast.error(
        cause instanceof Error ? cause.message : 'Unable to update favourites.',
      )
      return false
    }
  }
  return { user, vendorIds, toggle }
}
