import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/shared/components/ui/popover'
import { Calendar } from '@/shared/components/ui/calendar'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/table'
import type { AdminOrder, OrderFilters, QueryResult } from '../types'
import { calendarDayKey } from '../lib/dates'
import { StatusBadge } from './StatusBadge'
import { TableSkeleton } from './TableSkeleton'
import { QueryError } from './QueryError'
const statuses = [
  'pending',
  'accepted',
  'preparing',
  'rider_assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
]
const amount = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
})
export function OrdersOverviewTable({
  data,
  isLoading,
  error,
  refetch,
  filters,
  onFiltersChange,
}: QueryResult<AdminOrder[]> & {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
}) {
  const [range, setRange] = useState<DateRange | undefined>()
  function selectRange(next: DateRange | undefined) {
    setRange(next)
    onFiltersChange({
      ...filters,
      from: next?.from ? calendarDayKey(next.from) : undefined,
      to: next?.to ? calendarDayKey(next.to) : undefined,
    })
  }
  const dateLabel = range?.from
    ? `${range.from.toLocaleDateString('en-GB')}${range.to ? ` – ${range.to.toLocaleDateString('en-GB')}` : ' – select end date'}`
    : 'Choose date range'
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders overview</CardTitle>
        <CardDescription>
          Most recent 100 matching orders · Read only · Dates shown in Kano time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(status) =>
              onFiltersChange({
                ...filters,
                status: status === 'all' ? undefined : status,
              })
            }
          >
            <SelectTrigger
              aria-label="Filter orders by status"
              className="w-48"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="size-4" aria-hidden="true" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={range}
                onSelect={selectRange}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
          {range && (
            <Button variant="ghost" onClick={() => selectRange(undefined)}>
              <X className="size-4" aria-hidden="true" />
              Clear dates
            </Button>
          )}
        </div>
        {error ? (
          <QueryError error={error} retry={() => void refetch()} />
        ) : (
          <Table aria-label="Recent orders" aria-busy={isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total amount</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No orders match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell title={order.id} className="font-mono text-xs">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.vendor}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {amount.format(order.totalAmount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString('en-NG', {
                        timeZone: 'Africa/Lagos',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
