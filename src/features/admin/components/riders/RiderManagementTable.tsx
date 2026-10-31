import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Search } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { AdminRider, QueryResult } from '../../types'
import { StatusBadge } from '../StatusBadge'
import { QueryError } from '../QueryError'
import { TableSkeleton } from '../TableSkeleton'

export function RiderManagementTable({
  data,
  isLoading,
  error,
  refetch,
}: QueryResult<AdminRider[]>) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const rows = useMemo(
    () =>
      data?.filter(
        (rider) =>
          (status === 'all' || rider.status === status) &&
          rider.name
            .toLocaleLowerCase()
            .includes(search.trim().toLocaleLowerCase()),
      ) ?? [],
    [data, search, status],
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>All riders</CardTitle>
        <CardDescription>
          Monitor rider applications and availability.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search riders…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {['pending', 'approved', 'rejected', 'suspended'].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? (
          <QueryError error={error} retry={() => void refetch()} />
        ) : (
          <Table aria-label="All riders" aria-busy={isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : !rows.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No riders match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell className="font-medium">{rider.name}</TableCell>
                    <TableCell>{rider.vehicleType}</TableCell>
                    <TableCell>
                      <StatusBadge status={rider.status} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`mr-2 inline-block size-2 rounded-full ${rider.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                      />
                      {rider.isOnline ? 'Online' : 'Offline'}
                    </TableCell>
                    <TableCell>
                      {new Date(rider.createdAt).toLocaleDateString('en-NG', {
                        timeZone: 'Africa/Lagos',
                      })}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="text-primary underline"
                        to={`/admin/riders/${rider.id}`}
                      >
                        View
                      </Link>
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
