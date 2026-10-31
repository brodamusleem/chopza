import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { StorefrontVendor } from '../api'
import { RestaurantCard } from './RestaurantCard'

export function RestaurantCarousel({
  title,
  vendors,
  deliveryFee,
  emptyMessage,
}: {
  title: string
  vendors: StorefrontVendor[]
  deliveryFee: number | null
  emptyMessage: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  function scroll(direction: -1 | 1) {
    const firstCard = listRef.current?.firstElementChild
    if (!firstCard) return
    const distance = firstCard.getBoundingClientRect().width + 20
    listRef.current?.scrollBy({ left: distance * direction, behavior: 'smooth' })
  }
  return (
    <section aria-label={title} className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {vendors.length > 1 && (
          <div className="hidden gap-2 sm:flex">
            <Button size="icon" variant="outline" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button size="icon" variant="outline" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {vendors.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div
          ref={listRef}
          className="grid auto-cols-[minmax(250px,80%)] grid-flow-col gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 sm:auto-cols-[minmax(270px,32%)] sm:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {vendors.map((vendor) => (
            <div key={vendor.id} className="snap-start">
              <RestaurantCard vendor={vendor} deliveryFee={deliveryFee} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
