import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/table'
import type { AdminVendor, QueryResult } from '../types'
import { StatusBadge } from './StatusBadge'
import { TableSkeleton } from './TableSkeleton'
import { QueryError } from './QueryError'
export function VendorManagementTable({
  data,
  isLoading,
  error,
  refetch,
}: QueryResult<AdminVendor[]>) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const rows =
    data?.filter(
      (vendor) =>
        (status === 'all' || vendor.status === status) &&
        vendor.name
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
    ) ?? []
  return (
    <Card>
      <CardHeader>
        <CardTitle>All vendors</CardTitle>
        <CardDescription>
          Find a restaurant and check its current approval status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1">
            <Search
              className="absolute top-2.5 left-3 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Search all vendors"
              placeholder="Search restaurants…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              aria-label="Filter vendors by status"
              className="w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {['pending', 'approved', 'rejected', 'suspended'].map((value) => (
                <SelectItem value={value} key={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? (
          <QueryError error={error} retry={() => void refetch()} />
        ) : (
          <Table aria-label="All vendors" aria-busy={isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={3} />
              ) : !rows.length ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No vendors match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={vendor.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(vendor.createdAt).toLocaleDateString('en-NG', {
                        timeZone: 'Africa/Lagos',
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
