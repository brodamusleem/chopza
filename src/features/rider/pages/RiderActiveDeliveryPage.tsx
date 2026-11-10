import { useEffect, useState } from 'react'
import { Bike, MapPin, Phone, StickyNote } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import {
  addRiderStatusEvent,
  getRiderOrders,
  type RiderOrder,
} from '../api/rider.api'
import { useActiveDeliveryLocation } from '../hooks/useActiveDeliveryLocation'
import { toast } from 'sonner'
export function Component() {
  const { user } = useAuth()
  const [order, setOrder] = useState<RiderOrder>()
  const load = () => {
    if (user)
      void getRiderOrders(user.id, [
        'rider_assigned',
        'picked_up',
        'in_transit',
      ])
        .then((orders) => setOrder(orders[0]))
        .catch(() => toast.error('Unable to load active delivery.'))
  }
  useEffect(load, [user])
  const location = useActiveDeliveryLocation(order?.id, user?.id)
  if (!order)
    return <p className="text-muted-foreground">No active delivery.</p>
  const next =
    order.status === 'rider_assigned'
      ? { status: 'picked_up' as const, label: 'Confirm pickup' }
      : order.status === 'picked_up'
        ? { status: 'in_transit' as const, label: 'Start transit' }
        : { status: 'delivered' as const, label: 'Mark delivered' }
  const update = () =>
    void addRiderStatusEvent(order.id, next.status)
      .then(() => {
        toast.success(
          next.status === 'delivered'
            ? 'Delivery completed.'
            : 'Status updated.',
        )
        load()
      })
      .catch(() => toast.error('Unable to update delivery.'))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{order.vendor_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="flex items-start gap-2"><Bike className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Pickup</span><br />{order.vendor_address}</span></p>
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Delivery address</span><br />{order.delivery_address}</span></p>
        <p className="flex items-start gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Customer phone</span><br />{order.delivery_phone ? <a className="underline underline-offset-2" href={`tel:${order.delivery_phone}`}>{order.delivery_phone}</a> : 'Not provided'}</span></p>
        {order.delivery_notes && <p className="flex items-start gap-2"><StickyNote className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Delivery note</span><br />{order.delivery_notes}</span></p>}
        <p>
          {order.items
            .map((item) => `${item.quantity}× ${item.name}`)
            .join(', ')}
        </p>
        <p className="capitalize text-muted-foreground">
          {order.status.replaceAll('_', ' ')}
        </p>
        {location.error && (
          <div>
            <p className="text-sm text-destructive">
              Location: {location.error}
            </p>
            <Button variant="outline" size="sm" onClick={location.retry}>
              Retry location
            </Button>
          </div>
        )}
        {next.status === 'delivered' ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>{next.label}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Mark this delivery delivered?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This completes the active delivery.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={update}>
                  Confirm delivery
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button onClick={update}>{next.label}</Button>
        )}
      </CardContent>
    </Card>
  )
}
