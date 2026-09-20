import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, Bike, CheckCircle2, Clock3, DollarSign, MapPin, PackageCheck, Plus, Store, Users } from 'lucide-react'
import { Link } from 'react-router'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useRecentOrders } from '../hooks/useRecentOrders'
import { useAllVendors } from '../hooks/useAllVendors'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

const revenueData = [
  { day: 'Mon', revenue: 420000 },
  { day: 'Tue', revenue: 510000 },
  { day: 'Wed', revenue: 465000 },
  { day: 'Thu', revenue: 680000 },
  { day: 'Fri', revenue: 620000 },
  { day: 'Sat', revenue: 790000 },
  { day: 'Sun', revenue: 734000 },
]

const statusData = [
  { name: 'Delivered', value: 46, color: '#176844' },
  { name: 'Preparing', value: 24, color: '#f59e0b' },
  { name: 'Out for delivery', value: 18, color: '#f97316' },
  { name: 'Pending', value: 8, color: '#94a3b8' },
  { name: 'Cancelled', value: 4, color: '#ef4444' },
]

const sampleOrders = [
  { id: '#CZ-1048', customer: 'Amina Yusuf', vendor: 'Kano Bites', status: 'Preparing', total: '₦18,500', time: '10 min ago' },
  { id: '#CZ-1047', customer: 'Ibrahim Musa', vendor: 'Arewa Kitchen', status: 'Out for delivery', total: '₦9,800', time: '24 min ago' },
  { id: '#CZ-1046', customer: 'Fatima Bello', vendor: 'Taste of Kano', status: 'Delivered', total: '₦22,400', time: '38 min ago' },
  { id: '#CZ-1045', customer: 'Yusuf Abdullahi', vendor: 'Kano Bites', status: 'Pending', total: '₦6,200', time: '51 min ago' },
]

const sampleVendors = [
  { name: 'Kano Bites', cuisine: 'Nigerian · Fast food', rating: '4.8', orders: '284', revenue: '₦1.28m', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Arewa Kitchen', cuisine: 'Northern · Local', rating: '4.7', orders: '219', revenue: '₦984k', color: 'bg-amber-100 text-amber-700' },
  { name: 'Taste of Kano', cuisine: 'Continental · Grill', rating: '4.6', orders: '186', revenue: '₦762k', color: 'bg-orange-100 text-orange-700' },
]

const statusTone: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-700',
  Preparing: 'bg-amber-100 text-amber-700',
  'Out for delivery': 'bg-orange-100 text-orange-700',
  Pending: 'bg-slate-100 text-slate-600',
}

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

export function AdminDashboardPage() {
  const stats = useDashboardStats()
  const orders = useRecentOrders({})
  const vendors = useAllVendors()
  const [query, setQuery] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')

  const filteredOrders = useMemo(
    () =>
      sampleOrders.filter(
        (order) =>
          (orderStatus === 'all' || order.status === orderStatus) &&
          `${order.id} ${order.customer} ${order.vendor}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, orderStatus],
  )

  const totalVendors = stats.data?.totalVendors ?? vendors.data?.length ?? 42
  const totalOrders = orders.data?.length ?? 1284

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Sunday, 14 September 2026</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good morning, Chopza Admin</h2>
          <p className="mt-2 text-muted-foreground">Here&apos;s what&apos;s happening with your food operations today.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/reports">View reports</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/dashboard#vendors">
              <Plus className="size-4" /> Add vendor
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric title="Total orders" value={totalOrders.toLocaleString()} change="12.8%" icon={PackageCheck} />
        <Metric title="Pending orders" value="38" change="4.2%" icon={Clock3} tone="amber" />
        <Metric title="Active deliveries" value={String(stats.data?.inTransit ?? 24)} change="8.4%" icon={Bike} tone="orange" />
        <Metric title="Total vendors" value={totalVendors.toLocaleString()} change="6.1%" icon={Store} tone="blue" />
        <Metric title="Revenue" value={naira.format(734000)} change="18.6%" icon={DollarSign} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Revenue analytics</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Weekly performance across all vendors</p>
            </div>
            <Badge variant="outline">This week</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#176844" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#176844" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(value) => naira.format(Number(value))} />
                  <Area type="monotone" dataKey="revenue" stroke="#176844" strokeWidth={3} fill="url(#revenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order status</CardTitle>
            <p className="text-sm text-muted-foreground">1,284 orders this week</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" innerRadius={52} outerRadius={72} paddingAngle={3}>
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                {statusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="ml-auto font-semibold">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
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
              <Link to="/admin/dashboard#orders">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders..." />
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {['Pending', 'Preparing', 'Out for delivery', 'Delivered'].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Vendor</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                    <th className="pb-3 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{order.id}</td>
                      <td className="py-3">{order.customer}</td>
                      <td className="py-3 text-muted-foreground">{order.vendor}</td>
                      <td className="py-3">
                        <Badge className={statusTone[order.status]} variant="secondary">
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">{order.total}</td>
                      <td className="py-3 text-right text-muted-foreground">{order.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Top vendors</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Best performers this week</p>
            </div>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleVendors.map((vendor) => (
              <div key={vendor.name} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid size-10 place-items-center rounded-lg text-sm font-semibold ${vendor.color}`}>
                    {vendor.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.cuisine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-right text-sm">
                  <div>
                    <p className="font-medium">{vendor.orders}</p>
                    <p className="text-muted-foreground">orders</p>
                  </div>
                  <div>
                    <p className="font-medium">{vendor.revenue}</p>
                    <p className="text-muted-foreground">revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Live delivery activity</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">24 drivers currently on the road</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/admin/dispatch">
                <MapPin className="size-4" /> Open map
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Activity icon={Bike} title="Active drivers" value="24" detail="+3 since 9am" />
              <Activity icon={MapPin} title="In transit" value="18" detail="Across Kano" />
              <Activity icon={CheckCircle2} title="Avg. arrival" value="28 min" detail="6 min faster" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="justify-start" asChild>
              <Link to="/admin/dashboard#vendors">
                <Plus className="size-4" /> Add vendor
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/admin/dashboard#orders">
                <PackageCheck className="size-4" /> View all orders
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/admin/teams">
                <Users className="size-4" /> Invite team member
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function Metric({
  title,
  value,
  change,
  icon: Icon,
  tone = 'green',
}: {
  title: string
  value: string
  change: string
  icon: typeof Store
  tone?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          <span
            className={`grid size-9 place-items-center rounded-lg ${
              tone === 'amber'
                ? 'bg-amber-100 text-amber-700'
                : tone === 'orange'
                  ? 'bg-orange-100 text-orange-700'
                  : tone === 'blue'
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-emerald-600">
          <ArrowUpRight className="mr-1 inline size-3" />
          {change} <span className="text-muted-foreground">vs last week</span>
        </p>
      </CardContent>
    </Card>
  )
}

function Activity({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Bike
  title: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-xl font-semibold">{value}</p>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

export { AdminDashboardPage as Component }
