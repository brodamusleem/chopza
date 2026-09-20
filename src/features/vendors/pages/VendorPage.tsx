import { Link, useParams } from 'react-router'
import { useVendorMenu } from '../hooks/useVendorMenu'
import { MenuItemCard } from '@/features/ordering'
export function Component() {
  const { id = '' } = useParams()
  const { vendor, items, isLoading, error } = useVendorMenu(id)
  if (isLoading) return <p role="status">Loading restaurant...</p>
  if (error) return <p role="alert">{error.message}</p>
  if (!vendor)
    return (
      <div>
        <h1 className="text-2xl font-semibold">Restaurant not found</h1>
        <Link to="/vendors" className="underline">
          Return home
        </Link>
      </div>
    )
  return (
    <div className="space-y-7">
      <Link className="text-sm text-primary underline" to="/vendors">
        Home
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">{vendor.name}</h1>
        <p className="mt-3 text-muted-foreground">
          {vendor.area} · Demo menu
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
