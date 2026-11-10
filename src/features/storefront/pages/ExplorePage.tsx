import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { RotateCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { getAvailableDishes } from '../api'
import { useStorefront } from '../context'
import { useDeliveryLocation } from '../state'
import { RestaurantGrid } from '../components/RestaurantGrid'

export function Component() {
  const { vendors, settings, isLoading, error, retry } = useStorefront()
  const deliveryLocation = useDeliveryLocation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const cuisine = searchParams.get('cuisine')
  const [dishVendorIds, setDishVendorIds] = useState<string[]>([])
  const [dishError, setDishError] = useState<Error | null>(null)
  const deliveryFee = settings ? Number(settings.base_delivery_fee) : null

  useEffect(() => {
    if (!query) {
      setDishVendorIds([])
      setDishError(null)
      return
    }
    let active = true
    getAvailableDishes(query, vendors.map((vendor) => vendor.id), 100)
      .then((rows) => active && setDishVendorIds([...new Set(rows.map((row) => row.vendor_id))]))
      .catch((cause: unknown) => {
        if (active)
          setDishError(cause instanceof Error ? cause : new Error('Unable to search dishes.'))
      })
    return () => {
      active = false
    }
  }, [query, vendors])

  const allSorted = useMemo(() => {
    if (vendors.some((vendor) => vendor.distanceKm !== undefined)) return vendors
    return [...vendors].sort((a, b) => Number(b.is_open) - Number(a.is_open) || a.name.localeCompare(b.name))
  }, [vendors])
  const isFiltered = Boolean(query || cuisine)
  const matches = isFiltered
    ? allSorted.filter((vendor) => {
        const matchesCuisine = !cuisine || vendor.cuisine === cuisine
        const matchesQuery =
          !query ||
          vendor.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ||
          vendor.cuisine?.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ||
          dishVendorIds.includes(vendor.id)
        return matchesCuisine && matchesQuery
      })
    : []

  if (error)
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-destructive/30 bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">We couldn’t load the storefront</h1>
        <p role="alert" className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-5" onClick={retry}><RotateCw aria-hidden="true" />Retry</Button>
      </div>
    )

  return (
    <div className="space-y-7 pb-8 pt-5 sm:space-y-9 sm:pt-8">
      {isFiltered ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              {query ? `Results for “${query}”` : cuisine}
            </h2>
            {dishError && <p role="alert" className="mt-1 text-sm text-destructive">Dish search: {dishError.message}</p>}
          </div>
          <RestaurantGrid
            vendors={matches}
            deliveryFee={deliveryFee}
            isLoading={isLoading}
            emptyTitle={query ? 'No matching restaurants or dishes' : 'No restaurants in this category'}
            emptyMessage="Try another search or browse all restaurants."
          />
        </section>
      ) : (
        <section className="space-y-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All Restaurants</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {deliveryLocation.latitude !== null && deliveryLocation.longitude !== null
                ? 'Restaurants nearby, sorted by distance.'
                : deliveryLocation.address
                  ? `Restaurants around ${deliveryLocation.address}.`
                  : 'Restaurants available in your area.'}
            </p>
          </div>
          <RestaurantGrid
            vendors={allSorted}
            deliveryFee={deliveryFee}
            isLoading={isLoading}
            emptyTitle="No restaurants in this area yet"
            emptyMessage="Choose another delivery area or check back later."
          />
        </section>
      )}
    </div>
  )
}
