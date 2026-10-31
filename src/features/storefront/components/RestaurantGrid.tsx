import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { StorefrontVendor } from '../api'
import { RestaurantCard } from './RestaurantCard'

export function RestaurantGrid({
  vendors,
  deliveryFee,
  isLoading,
  emptyTitle = 'No restaurants found',
  emptyMessage = 'Try another search or choose a different category.',
}: {
  vendors: StorefrontVendor[]
  deliveryFee: number | null
  isLoading: boolean
  emptyTitle?: string
  emptyMessage?: string
}) {
  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} className="overflow-hidden rounded-2xl p-0">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    )
  if (!vendors.length)
    return (
      <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {vendors.map((vendor) => (
        <RestaurantCard key={vendor.id} vendor={vendor} deliveryFee={deliveryFee} />
      ))}
    </div>
  )
}
