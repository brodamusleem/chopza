import { useVendors } from '../hooks/useVendors'
import { VendorCard } from './VendorCard'
export function VendorList() {
  const { vendors, isLoading, error } = useVendors()
  if (isLoading) return <p role="status">Loading restaurants…</p>
  if (error) return <p role="alert">{error.message}</p>
  if (!vendors.length) return <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No restaurants are live yet — check back soon!</p>
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  )
}
