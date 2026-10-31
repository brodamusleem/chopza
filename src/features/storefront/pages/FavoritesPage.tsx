import { Link } from 'react-router'
import { Heart, LogIn } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import { useStorefront } from '../context'
import { useFavoriteState } from '../state'
import { RestaurantGrid } from '../components/RestaurantGrid'

export function Component() {
  const { user } = useAuth()
  const { vendors, settings, isLoading } = useStorefront()
  const favoriteIds = useFavoriteState((state) => state.vendorIds)
  const favorites = vendors.filter((vendor) => favoriteIds.includes(vendor.id))

  if (!user)
    return (
      <div className="mx-auto max-w-lg rounded-3xl border bg-card px-6 py-12 text-center">
        <Heart className="mx-auto size-9 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Your favourites</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to save restaurants and find them here later.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/login"><LogIn aria-hidden="true" />Sign in</Link></Button>
      </div>
    )

  return (
    <div className="space-y-6 pb-8 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Saved for later</p>
        <h1 className="mt-2 text-3xl font-semibold">Your favourites</h1>
      </div>
      {!isLoading && favoriteIds.length > 0 && favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">No favourites in this delivery area.</p>
          <p className="mt-2 text-sm text-muted-foreground">Choose All of Kano to see saved restaurants in other areas.</p>
        </div>
      ) : (
        <RestaurantGrid
          vendors={favorites}
          deliveryFee={settings ? Number(settings.base_delivery_fee) : null}
          isLoading={isLoading}
          emptyTitle="No favourites saved yet"
          emptyMessage="Save a restaurant with the heart button and it will appear here."
        />
      )}
    </div>
  )
}
