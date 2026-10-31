import { Link } from 'react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { AdminRider, QueryResult } from '../../types'
import { QueryError } from '../QueryError'
import { TableSkeleton } from '../TableSkeleton'

export function RiderApprovalTable({
  data,
  isLoading,
  error,
  refetch,
}: QueryResult<AdminRider[]>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rider applications</CardTitle>
        <CardDescription>
          Review delivery partners waiting to join the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <QueryError error={error} retry={() => void refetch()} />
        ) : (
          <Table aria-label="Pending rider applications" aria-busy={isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Plate number</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={5} />
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No riders waiting for approval.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell className="font-medium">{rider.name}</TableCell>
                    <TableCell>{rider.vehicleType}</TableCell>
                    <TableCell>{rider.plateNumber ?? '—'}</TableCell>
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
                        View application
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
