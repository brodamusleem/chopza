import { useState } from 'react'
import { RefreshCw, ShoppingBag } from 'lucide-react'
import { useRecentOrders } from '../hooks/useRecentOrders'
import { OrdersOverviewTable } from '../components/OrdersOverviewTable'
import type { OrderFilters } from '../types'
import { Button } from '@/shared/components/ui/button'

export function AdminOrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const orders = useRecentOrders(filters)
  return <section className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Operations</p><h2 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight"><ShoppingBag className="size-7" /> All Orders</h2><p className="mt-2 text-muted-foreground">Review order flow, payment totals, and delivery status.</p></div><Button variant="outline" onClick={() => void orders.refetch()} disabled={orders.isLoading}><RefreshCw className={orders.isLoading ? 'animate-spin' : ''} /> Refresh</Button></div><OrdersOverviewTable {...orders} filters={filters} onFiltersChange={setFilters} /></section>
}
