import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BadgeCheck, Heart, LockKeyhole, UtensilsCrossed } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
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
  const isNew = Date.now() - new Date(vendor.created_at).getTime() < 30 * 86400000
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
    <Card className="group relative h-full rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-lg">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={favorite ? `Remove ${vendor.name} from favourites` : `Add ${vendor.name} to favourites`}
        aria-pressed={favorite}
        disabled={saving}
        onClick={() => void onFavorite()}
        className="absolute top-3 right-3 z-10 size-9 rounded-full bg-background/95 shadow-sm hover:bg-background"
      >
        <Heart className={favorite ? 'fill-primary text-primary' : ''} />
      </Button>
      <Link
        to={`/explore/vendors/${vendor.id}`}
        className="block rounded-t-2xl focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-secondary">
          {image ? (
            <img
              src={image}
              alt={`${vendor.name} cover`}
              loading="lazy"
              className={`h-full w-full object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02] ${vendor.is_open ? '' : 'grayscale'}`}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/55 font-semibold tracking-[0.16em]">
              <LockKeyhole aria-hidden="true" className="mb-2 size-6" />
              CLOSED
            </div>
          )}
          {isNew && (
            <Badge className="absolute bottom-3 left-3 rounded-full">New</Badge>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold">{vendor.name}</h3>
            <span title="Approved by Chopza" aria-label="Approved by Chopza">
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
            </span>
          </div>
          <div className="flex min-h-5 items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="truncate">{vendor.cuisine || 'Restaurant'}</span>
            {deliveryFee !== null && (
              <span className="shrink-0">Delivery {formatNaira(Math.round(deliveryFee * 100))}</span>
            )}
          </div>
          {vendor.areaName && (
            <p className="truncate text-xs text-muted-foreground">{vendor.areaName}</p>
          )}
        </div>
      </Link>
    </Card>
  )
}
