import { Link } from 'react-router'
import { ArrowUpRight, UtensilsCrossed } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import type { Vendor } from '../types'
export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      to={`/vendors/${vendor.id}`}
      className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex h-36 items-center justify-center bg-secondary text-primary">
        <UtensilsCrossed size={42} strokeWidth={1.25} aria-hidden="true" />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{vendor.name}</h3>
          <ArrowUpRight size={18} aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">
          {vendor.cuisine} · {vendor.area}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {vendor.deliveryMinutes}–{vendor.deliveryMinutes + 10} min
          </span>
          <Badge variant="secondary">Demo menu</Badge>
        </div>
      </div>
    </Link>
  )
}
