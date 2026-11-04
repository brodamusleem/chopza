import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  Bike,
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPin,
  PackageCheck,
  Plus,
  Store,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics'
import { useRecentOrders } from '../hooks/useRecentOrders'
import { useAllVendors } from '../hooks/useAllVendors'
import { AddVendorDialog } from './AddVendorDialog'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})
const statusColors: Record<string, string> = {
  pending: '#94a3b8',
  accepted: '#0ea5e9',
  preparing: '#f59e0b',
  ready_for_pickup: '#a855f7',
  rider_assigned: '#6366f1',
  picked_up: '#f97316',
  in_transit: '#fb923c',
  delivered: '#176844',
  cancelled: '#ef4444',
}

function titleCaseStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  }
  return formatter.format(seconds, 'second')
}

export function AdminDashboardPage() {
  const stats = useDashboardStats()
  const analytics = useDashboardAnalytics()
  const orders = useRecentOrders({})
  const vendors = useAllVendors()
  const [query, setQuery] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')
  const dateLine = new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  }).format(new Date())
  const hour = Number(
    new Intl.DateTimeFormat('en-NG', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'Africa/Lagos',
    }).format(new Date()),
  )
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const filteredOrders = useMemo(
    () =>
      (orders.data ?? []).filter((order) => {
        const searchMatch = `${order.id} ${order.customer} ${order.vendor}`
          .toLowerCase()
          .includes(query.toLowerCase())
        return searchMatch && (orderStatus === 'all' || order.status === orderStatus)
      }),
    [orders.data, query, orderStatus],
  )
  const statusData = (analytics.data?.orderStatuses ?? []).map((item) => ({
    ...item,
    name: titleCaseStatus(item.status),
    color: statusColors[item.status] ?? '#64748b',
  }))
  const totalForStatuses = analytics.data?.ordersThisWeek ?? 0
  const deliveryCount = stats.data?.inTransit ?? 0

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">{dateLine}</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting}, Chopza Admin
          </h2>
          <p className="mt-2 text-muted-foreground">
            Here&apos;s what&apos;s happening with your food operations today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/reports">View reports</Link>
          </Button>
          <AddVendorDialog
            onAdded={() => {
              void stats.refetch()
              void vendors.refetch()
            }}
            trigger={<><Plus className="size-4" /> Add vendor</>}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric title="Total orders" value={stats.isLoading ? '—' : (stats.data?.totalOrders ?? 0).toLocaleString()} detail="All orders" icon={PackageCheck} />
        <Metric title="Pending orders" value={stats.isLoading ? '—' : String(stats.data?.pendingOrders ?? 0)} detail="Awaiting acceptance" icon={Clock3} tone="amber" />
        <Metric title="Active deliveries" value={stats.isLoading ? '—' : String(deliveryCount)} detail="Rider assigned or in transit" icon={Bike} tone="orange" />
        <Metric title="Total vendors" value={stats.isLoading ? '—' : String(stats.data?.totalVendors ?? 0)} detail="Registered businesses" icon={Store} tone="blue" />
        <Metric title="Total riders" value={stats.isLoading ? '—' : String(stats.data?.totalRiders ?? 0)} detail="Registered riders" icon={Bike} tone="orange" />
        <Metric title="Revenue" value={stats.isLoading ? '—' : naira.format(stats.data?.totalRevenue ?? 0)} detail="Successfully paid" icon={DollarSign} tone="green" />
      </div>

      {(stats.error || analytics.error || orders.error) && (
        <Card role="alert" className="border-destructive/40">
          <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <p className="text-sm text-destructive">
              {stats.error?.message ?? analytics.error?.message ?? orders.error?.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (stats.error) void stats.refetch()
                if (analytics.error) void analytics.refetch()
                if (orders.error) void orders.refetch()
              }}
            >
              Refresh dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Revenue analytics</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Captured payments across all vendors
              </p>
            </div>
            <Badge variant="outline">This week</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analytics.data && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.data.revenueByDay}>
                    <defs>
                      <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#176844" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#176844" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(value) => naira.format(Number(value))} />
                    <Area type="monotone" dataKey="revenue" stroke="#176844" strokeWidth={3} fill="url(#revenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {analytics.data && analytics.data.revenueByDay.every((day) => day.revenue === 0) && (
                <p className="pt-20 text-center text-sm text-muted-foreground">No successful payments this week yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order status</CardTitle>
            <p className="text-sm text-muted-foreground">
              {analytics.isLoading ? 'Loading this week’s orders…' : `${totalForStatuses.toLocaleString()} orders this week`}
            </p>
          </CardHeader>
          <CardContent>
            {totalForStatuses === 0 && !analytics.isLoading ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No orders this week yet.</p>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-40 w-40 shrink-0 sm:h-44 sm:w-44">
                  {analytics.data && <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={2}>
                        {statusData.map((entry) => <Cell key={entry.status} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Orders']} />
                    </PieChart>
                  </ResponsiveContainer>}
                </div>
                <div className="max-h-48 flex-1 space-y-2 overflow-y-auto text-xs sm:text-sm">
                  {statusData.filter((entry) => entry.count > 0).map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="min-w-0 truncate text-muted-foreground">{entry.name}</span>
                      <span className="ml-auto font-semibold">{entry.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent orders</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Latest activity from your marketplace</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders">View all <ArrowUpRight className="size-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders..." />
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.keys(statusColors).map((status) => <SelectItem key={status} value={status}>{titleCaseStatus(status)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground"><tr>
                  <th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Vendor</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Total</th><th className="pb-3 text-right font-medium">Time</th>
                </tr></thead>
                <tbody>
                  {filteredOrders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-3">{order.customer}</td>
                      <td className="py-3 text-muted-foreground">{order.vendor}</td>
                      <td className="py-3"><Badge variant="secondary" className="whitespace-nowrap" style={{ backgroundColor: `${statusColors[order.status] ?? '#64748b'}20`, color: statusColors[order.status] ?? '#64748b' }}>{titleCaseStatus(order.status)}</Badge></td>
                      <td className="py-3 text-right font-medium">{naira.format(Number(order.totalAmount))}</td>
                      <td className="py-3 text-right text-muted-foreground">{relativeTime(order.createdAt)}</td>
                    </tr>
                  ))}
                  {!orders.isLoading && filteredOrders.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No matching orders found.</td></tr>}
                  {orders.isLoading && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Loading recent orders…</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div><CardTitle>Top vendors</CardTitle><p className="mt-1 text-sm text-muted-foreground">Best performers this week</p></div>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {(analytics.data?.topVendors ?? []).map((vendor, index) => (
              <div key={vendor.id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-sm font-semibold text-emerald-700">{vendor.name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0"><p className="truncate font-medium">{index + 1}. {vendor.name}</p><p className="text-xs text-muted-foreground">{vendor.orders.toLocaleString()} paid orders</p></div>
                </div>
                <div className="shrink-0 text-right text-sm"><p className="font-medium">{naira.format(vendor.revenue)}</p><p className="text-muted-foreground">sales</p></div>
              </div>
            ))}
            {analytics.data && analytics.data.topVendors.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No vendors have paid orders this week yet.</p>}
            {analytics.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading vendor performance…</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle>Delivery activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">Current marketplace delivery counts</p></div>
            <Button size="sm" variant="outline" asChild><Link to="/admin/dispatch"><MapPin className="size-4" /> Open map</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Activity icon={Bike} title="Active deliveries" value={stats.isLoading ? '—' : String(deliveryCount)} detail="Assigned, picked up, or in transit" />
              <Activity icon={MapPin} title="Orders today" value={stats.isLoading ? '—' : String(stats.data?.ordersToday ?? 0)} detail="Created since midnight" />
              <Activity icon={CheckCircle2} title="Delivered this week" value={analytics.isLoading ? '—' : String(statusData.find((item) => item.status === 'delivered')?.count ?? 0)} detail="Completed orders" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <AddVendorDialog onAdded={() => { void stats.refetch(); void vendors.refetch() }} trigger={<><Plus className="size-4" /> Add vendor</>} />
            <Button variant="outline" className="justify-start" asChild><Link to="/admin/orders"><PackageCheck className="size-4" /> View all orders</Link></Button>
            <Button variant="outline" className="justify-start" asChild><Link to="/admin/teams"><Users className="size-4" /> Invite team member</Link></Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function Metric({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'green',
}: {
  title: string
  value: string
  detail: string
  icon: typeof Store
  tone?: string
}) {
  return (
    <Card><CardContent className="p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{title}</span><span className={`grid size-9 place-items-center rounded-lg ${tone === 'amber' ? 'bg-amber-100 text-amber-700' : tone === 'orange' ? 'bg-orange-100 text-orange-700' : tone === 'blue' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}><Icon className="size-4" /></span></div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </CardContent></Card>
  )
}

function Activity({ icon: Icon, title, value, detail }: { icon: typeof Bike; title: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-muted/30 p-4"><Icon className="size-5 text-primary" /><p className="mt-3 text-xl font-semibold">{value}</p><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}

export { AdminDashboardPage as Component }
