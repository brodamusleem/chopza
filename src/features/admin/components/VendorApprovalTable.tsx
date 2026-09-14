import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/table'
import { approveVendor, rejectVendor } from '../api/admin.api'
import type { AdminVendor, QueryResult } from '../types'
import { StatusBadge } from './StatusBadge'
import { TableSkeleton } from './TableSkeleton'
import { QueryError } from './QueryError'
export function VendorApprovalTable({
  data,
  isLoading,
  error,
  refetch,
  onMutation,
}: QueryResult<AdminVendor[]> & { onMutation: () => Promise<void> }) {
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<{
    id: string
    action: 'approve' | 'reject'
  } | null>(null)
  const rows =
    data?.filter((vendor) =>
      vendor.name
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
    ) ?? []
  async function mutate(vendor: AdminVendor, action: 'approve' | 'reject') {
    if (pending) return
    setPending({ id: vendor.id, action })
    try {
      await (action === 'approve'
        ? approveVendor(vendor.id)
        : rejectVendor(vendor.id))
      toast.success(
        action === 'approve'
          ? `${vendor.name} approved`
          : `${vendor.name} rejected`,
      )
      await onMutation()
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'The vendor could not be updated.',
      )
    } finally {
      setPending(null)
    }
  }
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
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          disabled={Boolean(pending)}
                          onClick={() => void mutate(vendor, 'approve')}
                          aria-label={`Approve ${vendor.name}`}
                        >
                          {pending?.id === vendor.id &&
                            pending.action === 'approve' && (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            )}
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={Boolean(pending)}
                          onClick={() => void mutate(vendor, 'reject')}
                          aria-label={`Reject ${vendor.name}`}
                        >
                          {pending?.id === vendor.id &&
                            pending.action === 'reject' && (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            )}
                          Reject
                        </Button>
                      </div>
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
