import { useVendors } from '../hooks/useVendors'
import { VendorCard } from './VendorCard'
export function VendorList() {
  const { vendors } = useVendors()
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  )
}
