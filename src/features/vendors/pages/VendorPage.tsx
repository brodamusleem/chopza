import { Link, useParams } from 'react-router'
import { useVendorMenu } from '../hooks/useVendorMenu'
import { MenuItemCard } from '@/features/ordering'
export function Component() {
  const { id = '' } = useParams()
  const { vendor, items } = useVendorMenu(id)
  if (!vendor)
    return (
      <div>
        <h1 className="text-2xl font-semibold">Restaurant not found</h1>
        <Link to="/vendors" className="underline">
          Browse restaurants
        </Link>
      </div>
    )
  return (
    <div className="space-y-7">
      <Link className="text-sm text-primary underline" to="/vendors">
        All restaurants
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">{vendor.name}</h1>
        <p className="mt-3 text-muted-foreground">
          {vendor.cuisine} · {vendor.area} · Demo menu
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} vendor={vendor} />
        ))}
      </div>
    </div>
  )
}
