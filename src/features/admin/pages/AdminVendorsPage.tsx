import { useState } from 'react'
import { RefreshCw, Search, Store } from 'lucide-react'
import { useAllVendors } from '../hooks/useAllVendors'
import { VendorManagementTable } from '../components/VendorManagementTable'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'

export function AdminVendorsPage() {
  const vendors = useAllVendors()
  const [query, setQuery] = useState('')
  const filtered = vendors.data?.filter((vendor) => vendor.name.toLowerCase().includes(query.toLowerCase()))
  return <section className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Operations</p><h2 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight"><Store className="size-7" /> All Vendors</h2><p className="mt-2 text-muted-foreground">Monitor every restaurant and food partner on Chopza.</p></div><Button variant="outline" onClick={() => void vendors.refetch()} disabled={vendors.isLoading}><RefreshCw className={vendors.isLoading ? 'animate-spin' : ''} /> Refresh</Button></div><div className="relative max-w-md"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search vendors..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><VendorManagementTable {...vendors} data={filtered} /></section>
}
