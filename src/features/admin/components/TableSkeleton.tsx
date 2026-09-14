import { Skeleton } from '@/shared/components/ui/skeleton'
import { TableRow, TableCell } from '@/shared/components/ui/table'
export function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, row) => (
        <TableRow key={row}>
          {Array.from({ length: columns }, (_, column) => (
            <TableCell key={column}>
              <Skeleton className="h-5 w-full min-w-16" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
