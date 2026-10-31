import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { approveRider, rejectRider, suspendRider } from '../api/admin.api'
import { StatusBadge } from '../components/StatusBadge'
import { useRiderDetail } from '../hooks/useRiderDetail'
import { useState, type ReactNode } from 'react'

export function AdminRiderDetailPage() {
  const { riderId = '' } = useParams()
  const navigate = useNavigate()
  const query = useRiderDetail(riderId)
  const [action, setAction] = useState<
    'approved' | 'rejected' | 'suspended' | null
  >(null)
  const rider = query.data
  const mutate = async (status: 'approved' | 'rejected' | 'suspended') => {
    if (!rider) return
    setAction(status)
    try {
      if (status === 'approved') await approveRider(rider.id)
      else if (status === 'rejected') await rejectRider(rider.id)
      else await suspendRider(rider.id)
      toast.success(`${rider.name} ${status}`)
      navigate('/admin/riders', { replace: true })
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : `Unable to mark rider ${status}.`,
      )
    } finally {
      setAction(null)
    }
  }
  if (query.isLoading)
    return (
      <Card>
        <CardContent className="py-12 text-center">
          Loading rider application...
        </CardContent>
      </Card>
    )
  if (query.error)
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Could not load application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw /> Try again
          </Button>
        </CardContent>
      </Card>
    )
  if (!rider)
    return (
      <Card>
        <CardContent className="py-12 text-center">
          Rider application not found.
        </CardContent>
      </Card>
    )
  return (
    <section className="space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/admin/riders">
          <ArrowLeft /> All riders
        </Link>
      </Button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-primary">Rider application</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {rider.name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Submitted{' '}
            {new Date(rider.createdAt).toLocaleString('en-NG', {
              timeZone: 'Africa/Lagos',
            })}
          </p>
        </div>
        <StatusBadge status={rider.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rider details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Detail label="Vehicle type" value={rider.vehicleType} />
            <Detail
              label="Plate number"
              value={rider.plateNumber ?? 'Not provided'}
            />
            <Detail
              label="Availability"
              value={
                <Badge variant={rider.isOnline ? 'default' : 'outline'}>
                  {rider.isOnline ? 'Online' : 'Offline'}
                </Badge>
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Detail label="Full name" value={rider.name} />
            <Detail label="Email" value={rider.email ?? 'Not available'} />
            <Detail label="Phone" value={rider.phone ?? 'Not available'} />
          </CardContent>
        </Card>
      </div>
      {rider.status === 'pending' && (
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={action !== null}
            onClick={() => void mutate('approved')}
          >
            {action === 'approved' ? 'Approving…' : 'Approve rider'}
          </Button>
          <Button
            variant="destructive"
            disabled={action !== null}
            onClick={() => void mutate('rejected')}
          >
            {action === 'rejected' ? 'Rejecting…' : 'Reject rider'}
          </Button>
        </div>
      )}
      {rider.status === 'approved' && (
        <Button
          variant="destructive"
          disabled={action !== null}
          onClick={() => void mutate('suspended')}
        >
          {action === 'suspended' ? 'Suspending…' : 'Suspend rider'}
        </Button>
      )}
    </section>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}
