import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatNaira } from '@/shared/lib/currency'
import { getRiderHistory, type RiderOrder } from '../api/rider.api'

export function Component() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<RiderOrder[]>([])
  const [status, setStatus] = useState<'all' | 'delivered' | 'cancelled'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useEffect(() => {
    if (user)
      void getRiderHistory(
        user.id,
        status === 'all' ? ['delivered', 'cancelled'] : [status],
        from || undefined,
        to || undefined,
      ).then(setOrders)
  }, [user, status, from, to])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Delivery history</h1>
        <p className="text-muted-foreground">
          Review completed and cancelled deliveries.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Select
          value={status}
          onValueChange={(value) => {
            if (
              value === 'all' ||
              value === 'delivered' ||
              value === 'cancelled'
            )
              setStatus(value)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="w-40"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label="From date"
        />
        <Input
          className="w-40"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          aria-label="To date"
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Order total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.vendor_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.status.replaceAll('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNaira(order.total_amount * 100)}
                  </TableCell>
                </TableRow>
              ))}
              {!orders.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No deliveries match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
