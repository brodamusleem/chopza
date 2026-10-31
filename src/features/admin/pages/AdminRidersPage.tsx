import { Bike, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { RiderManagementTable } from '../components/riders/RiderManagementTable'
import { useAllRiders } from '../hooks/useAllRiders'

export function AdminRidersPage() {
  const riders = useAllRiders()
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Operations</p>
          <h2 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Bike className="size-7" /> All riders
          </h2>
          <p className="mt-2 text-muted-foreground">
            Monitor every delivery partner on Chopza.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void riders.refetch()}
          disabled={riders.isLoading}
        >
          <RefreshCw className={riders.isLoading ? 'animate-spin' : ''} />{' '}
          Refresh
        </Button>
      </div>
      <RiderManagementTable {...riders} />
    </section>
  )
}
