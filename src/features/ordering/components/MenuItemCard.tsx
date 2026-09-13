import type { MenuItem, Vendor } from '@/features/vendors'
import { Button } from '@/shared/components/ui/button'
import { formatNaira } from '@/shared/lib/currency'
import { useCartStore } from '../store/cartStore'
import { toast } from 'sonner'
export function MenuItemCard({
  item,
  vendor,
}: {
  item: MenuItem
  vendor: Vendor
}) {
  const addItem = useCartStore((state) => state.addItem)
  return (
    <article className="flex flex-col justify-between gap-5 rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{formatNaira(item.priceKobo)}</span>
        <Button
          disabled={!item.available}
          onClick={() => {
            addItem({
              menuItemId: item.id,
              vendorId: vendor.id,
              vendorName: vendor.name,
              name: item.name,
              unitPriceKobo: item.priceKobo,
            })
            toast.success(`${item.name} added to cart`)
          }}
        >
          Add to cart
        </Button>
      </div>
    </article>
  )
}
