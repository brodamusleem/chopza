import { useEffect, useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/shared/components/ui/tabs'
import { useVendorApprovalQueue } from '../hooks/useVendorApprovalQueue'
import { useAllVendors } from '../hooks/useAllVendors'
import { useRecentOrders } from '../hooks/useRecentOrders'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useOrdersPerDayChartData } from '../hooks/useOrdersPerDayChartData'
import { StatsCards } from './StatsCards'
import { OrdersPerDayChart } from './OrdersPerDayChart'
import { VendorApprovalTable } from './VendorApprovalTable'
import { VendorManagementTable } from './VendorManagementTable'
import { OrdersOverviewTable } from './OrdersOverviewTable'
import type { OrderFilters } from '../types'
export function AdminDashboardPage() {
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({})
  const [section, setSection] = useState(() => window.location.hash.slice(1) || 'approvals')
  const approvals = useVendorApprovalQueue()
  const vendors = useAllVendors()
  const orders = useRecentOrders(orderFilters)
  const stats = useDashboardStats()
  const chart = useOrdersPerDayChartData()
  useEffect(() => {
    const syncSection = () => setSection(window.location.hash.slice(1) || 'approvals')
    window.addEventListener('hashchange', syncSection)
    syncSection()
    return () => window.removeEventListener('hashchange', syncSection)
  }, [])
  function selectSection(value: string) {
    setSection(value)
    window.location.hash = value
  }
  async function refreshAfterMutation() {
    await Promise.all([approvals.refetch(), vendors.refetch(), stats.refetch()])
  }
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl" role="heading" aria-level={1}>
            Admin dashboard
          </CardTitle>
          <CardDescription>
            Review vendor applications and monitor orders across Kano.
          </CardDescription>
        </CardHeader>
      </Card>
      <StatsCards {...stats} />
      <OrdersPerDayChart {...chart} />
      <Tabs value={section} onValueChange={selectSection}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="approvals">Vendor Approvals</TabsTrigger>
          <TabsTrigger value="vendors">All Vendors</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="approvals">
          <VendorApprovalTable
            {...approvals}
            onMutation={refreshAfterMutation}
          />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorManagementTable {...vendors} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersOverviewTable
            {...orders}
            filters={orderFilters}
            onFiltersChange={setOrderFilters}
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}
export { AdminDashboardPage as Component }
