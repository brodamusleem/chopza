import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  claimDelivery,
  getAvailableJobs,
  getRiderOrders,
  type RiderOrder,
} from '../api/rider.api'
import { useRiderApplicationStatus } from '../hooks/useRiderApplicationStatus'
import { toast } from 'sonner'
export function Component() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { application } = useRiderApplicationStatus()
  const [jobs, setJobs] = useState<RiderOrder[]>([])
  const [hasActiveDelivery, setHasActiveDelivery] = useState(false)
  const load = () => {
    void getAvailableJobs()
      .then(setJobs)
      .catch(() => toast.error('Unable to load available jobs.'))
    if (user)
      void getRiderOrders(user.id, [
        'rider_assigned',
        'picked_up',
        'in_transit',
      ])
        .then((orders) => setHasActiveDelivery(orders.length > 0))
        .catch(() => toast.error('Unable to load active delivery.'))
  }
  useEffect(load, [user])
  if (hasActiveDelivery) return <Navigate to="/rider/active" replace />
  if (!application?.is_online)
    return (
      <Card>
        <CardHeader>
          <CardTitle>You are offline</CardTitle>
        </CardHeader>
        <CardContent>
          Go online from the sidebar to view and claim available deliveries.
        </CardContent>
      </Card>
    )
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Available jobs</h1>
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <CardTitle>{job.vendor_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Pick up: {job.vendor_address}</p>
            <p>Drop-off: {job.delivery_address}</p>
            <Button
              className="mt-4"
              onClick={() =>
                void claimDelivery(job.id)
                  .then(() => navigate('/rider/active'))
                  .catch((error: unknown) => {
                    toast.error(
                      error instanceof Error &&
                        error.message.includes('claimed')
                        ? 'This delivery was just claimed. Refreshing jobs.'
                        : 'Unable to claim delivery.',
                    )
                    load()
                  })
              }
            >
              Claim this delivery
            </Button>
          </CardContent>
        </Card>
      ))}
      {!jobs.length && (
        <p className="text-muted-foreground">
          No deliveries are available right now.
        </p>
      )}
    </div>
  )
}
