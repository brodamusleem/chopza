import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BadgeCheck, Bike, Clock3, Heart, LockKeyhole, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { formatNaira } from '@/shared/lib/currency'
import type { StorefrontVendor } from '../api'
import { useFavoriteToggle } from '../hooks'

export function RestaurantCard({
  vendor,
  deliveryFee,
}: {
  vendor: StorefrontVendor
  deliveryFee: number | null
}) {
  const navigate = useNavigate()
  const { user, vendorIds, toggle } = useFavoriteToggle()
  const [saving, setSaving] = useState(false)
  const favorite = vendorIds.includes(vendor.id)
  const image = vendor.cover_url || vendor.logo_url

  async function onFavorite() {
    if (!user) {
      navigate('/login', { state: { from: '/explore' } })
      return
    }
    setSaving(true)
    await toggle(vendor.id)
    setSaving(false)
  }

  return (
    <Card className="group relative h-full overflow-hidden rounded-2xl border-0 bg-transparent shadow-none transition-shadow hover:shadow-none">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={favorite ? `Remove ${vendor.name} from favourites` : `Add ${vendor.name} to favourites`}
        aria-pressed={favorite}
        disabled={saving}
        onClick={() => void onFavorite()}
        className="absolute top-3 right-3 z-10 size-12 rounded-full bg-background shadow-md hover:bg-background"
      >
        <Heart className={favorite ? 'fill-primary text-primary' : ''} />
      </Button>
      <Link
        to={`/explore/vendors/${vendor.id}`}
        className="block rounded-t-2xl focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="relative aspect-[2.2/1] overflow-hidden rounded-2xl bg-secondary sm:aspect-[2/1]">
          {image ? (
            <img
              src={image}
              alt={`${vendor.name} cover`}
              loading="lazy"
              className={`h-full w-full object-cover object-center transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02] ${vendor.is_open ? '' : 'grayscale'}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
              <span className="grid size-20 place-items-center rounded-full bg-background/80 text-2xl font-semibold">
                {vendor.name.slice(0, 2).toUpperCase()}
              </span>
              <UtensilsCrossed aria-hidden="true" className="absolute bottom-4 left-4 size-5 opacity-60" />
            </div>
          )}
          {!vendor.is_open && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 font-semibold tracking-[0.2em] text-white">
              <LockKeyhole aria-hidden="true" className="mb-1 size-7" />
              <span className="text-base">CLOSED</span>
            </div>
          )}
        </div>
        <div className="space-y-2 px-3 pb-1 pt-3 sm:px-2">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold">{vendor.name}</h3>
            <span title="Approved by Chopza" aria-label="Approved by Chopza">
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
            </span>
          </div>
          <div className="flex min-h-5 flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            {deliveryFee !== null && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <Bike className="size-4 text-primary" aria-hidden="true" />
                {formatNaira(Math.round(deliveryFee * 100))}
              </span>
            )}
            <span className="inline-flex shrink-0 items-center gap-1.5 border-l pl-3">
              <Clock3 className="size-4 text-primary" aria-hidden="true" />
              12–20 mins
            </span>
          </div>
        </div>
      </Link>
    </Card>
  )
}
