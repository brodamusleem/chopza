import { useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
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
export function VendorApprovalTable({
  data,
  isLoading,
  error,
  refetch,
}: QueryResult<AdminVendor[]>) {
  const [search, setSearch] = useState('')
  const rows =
    data?.filter((vendor) =>
      vendor.name
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
    ) ?? []
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor approvals</CardTitle>
        <CardDescription>
          Review restaurants waiting to join the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search
            className="absolute top-2.5 left-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search pending vendors"
            placeholder="Search pending vendors…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        {error ? (
          <QueryError error={error} retry={() => void refetch()} />
        ) : (
          <Table aria-label="Pending vendor approvals" aria-busy={isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={4} />
              ) : !rows.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {search
                      ? 'No matching pending vendors.'
                      : 'No vendors waiting for approval.'}
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
                    <TableCell><Link className="text-primary underline" to={`/admin/vendors/${vendor.id}`}>View application</Link></TableCell>
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
