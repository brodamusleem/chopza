import { Link } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { formatNaira } from '@/shared/lib/currency'
import { useCart } from '../hooks/useCart'
export function Cart() {
  const { groups, totalKobo, setQuantity, removeItem } = useCart()
  if (!groups.length)
    return (
      <div className="rounded-xl border p-8">
        <p>Your cart is waiting for something delicious.</p>
        <Link
          to="/"
          className="mt-4 inline-block font-medium text-primary underline"
        >
          Explore restaurants
        </Link>
      </div>
    )
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.vendorId} className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">{group.vendorName}</h2>
          {group.items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex flex-wrap items-center justify-between gap-4 border-t py-4"
            >
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatNaira(item.unitPriceKobo)} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Decrease ${item.name}`}
                  onClick={() =>
                    setQuantity(
                      item.vendorId,
                      item.menuItemId,
                      item.quantity - 1,
                    )
                  }
                >
                  −
                </Button>
                <span aria-live="polite">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Increase ${item.name}`}
                  disabled={item.quantity >= 99}
                  onClick={() =>
                    setQuantity(
                      item.vendorId,
                      item.menuItemId,
                      item.quantity + 1,
                    )
                  }
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => removeItem(item.vendorId, item.menuItemId)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <p className="text-right font-medium">
            Subtotal {formatNaira(group.subtotalKobo)}
          </p>
        </section>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xl font-semibold">
          Food total {formatNaira(totalKobo)}
        </p>
        <Link
          to="/checkout"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Continue to checkout
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Demo prices. Delivery fees and server price validation will be added
        with checkout.
      </p>
    </div>
  )
}
