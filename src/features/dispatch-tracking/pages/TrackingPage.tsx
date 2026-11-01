import { useEffect, useState } from 'react'
import { Bike, MapPin, Store } from 'lucide-react'
import { useParams } from 'react-router'
import { z } from 'zod'
import { useOrderStatusChannel } from '../hooks/useOrderStatusChannel'
import { useLiveOrderPosition } from '../hooks/useLiveOrderPosition'
import { Button } from '@/shared/components/ui/button'
import { initializePayment } from '@/features/ordering/api/orders.api'
import { supabase } from '@/shared/lib/supabaseClient'

type Point = { latitude: number; longitude: number }

function deliveryProgress(origin: Point, destination: Point, rider: Point) {
  const averageLatitude = ((origin.latitude + destination.latitude) / 2) * Math.PI / 180
  const startX = origin.longitude * Math.cos(averageLatitude)
  const endX = destination.longitude * Math.cos(averageLatitude)
  const riderX = rider.longitude * Math.cos(averageLatitude)
  const dx = endX - startX
  const dy = destination.latitude - origin.latitude
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared < 1e-12) return null
  const ratio = ((riderX - startX) * dx + (rider.latitude - origin.latitude) * dy) / lengthSquared
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100)
}

export function Component() {
  const { id } = useParams()
  const validId = z.uuid().safeParse(id)
  const { order, error, state } = useOrderStatusChannel(
    validId.success ? validId.data : undefined,
  )
  const livePosition = useLiveOrderPosition(order?.id, order?.rider_id ?? undefined)
  const savedLocation =
    order?.current_lat != null && order.current_lng != null && order.location_updated_at && order.rider_id
      ? { riderId: order.rider_id, lat: order.current_lat, lng: order.current_lng, accuracy: 0, timestamp: Date.parse(order.location_updated_at) }
      : null
  const location = livePosition.location ?? savedLocation
  const [origin, setOrigin] = useState<Point | null>(null)
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    let active = true
    setOrigin(null)
    if (!supabase || !order?.vendor_id) return
    void supabase
      .from('vendors')
      .select('latitude, longitude')
      .eq('id', order.vendor_id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.latitude != null && data.longitude != null) {
          setOrigin({ latitude: data.latitude, longitude: data.longitude })
        }
      })
    return () => { active = false }
  }, [order?.vendor_id])

  async function payNow() {
    if (!order?.cart_group_id) return
    setPaying(true)
    setPaymentError('')
    try {
      const { authorization_url } = await initializePayment(order.cart_group_id)
      window.location.assign(authorization_url)
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : 'Unable to start payment.')
    } finally {
      setPaying(false)
    }
  }

  const destination = order?.delivery_latitude != null && order.delivery_longitude != null
    ? { latitude: order.delivery_latitude, longitude: order.delivery_longitude }
    : null
  const progress = origin && destination && location
    ? deliveryProgress(origin, destination, { latitude: location.lat, longitude: location.lng })
    : null

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Live delivery</p>
        <h1 className="mt-2 text-3xl font-semibold">Track your rider</h1>
      </div>

      {!validId.success && <p role="alert">Enter a valid order ID to connect tracking.</p>}

      {order?.payment_status === 'unpaid' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          <p role="status">Awaiting payment</p>
          <Button size="sm" disabled={paying} onClick={() => void payNow()}>{paying ? 'Opening Paystack…' : 'Pay now'}</Button>
        </div>
      )}
      {paymentError && <p role="alert" className="text-sm text-destructive">{paymentError}</p>}
      {error && <p role="alert">{error}</p>}

      <section aria-label="Rider delivery position" className="space-y-7 rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 text-sm font-medium">
          <span className="flex items-center gap-2"><Store aria-hidden="true" className="size-5 text-primary" />Restaurant</span>
          <span className="flex items-center gap-2 text-right"><MapPin aria-hidden="true" className="size-5 text-primary" />Your destination</span>
        </div>

        <div className="relative my-5 h-10">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />
          {progress != null && (
            <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary transition-[width] duration-1000" style={{ width: `${progress}%` }} />
          )}
          <span className="absolute left-0 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
          <span className="absolute right-0 top-1/2 size-4 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
          {progress != null && (
            <span
              role="progressbar"
              aria-label="Rider delivery position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="absolute top-1/2 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-primary shadow-md transition-[left] duration-1000"
              style={{ left: `${progress}%` }}
            >
              <Bike aria-hidden="true" className="size-5" />
            </span>
          )}
        </div>

        <p role="status" className="text-center text-sm text-muted-foreground">
          {order?.status === 'delivered'
            ? 'Your delivery has arrived.'
            : progress != null
              ? `Your rider is about ${progress}% of the way to you.`
              : !order?.rider_id
                ? 'Waiting for a rider to be assigned.'
                : !destination
                  ? 'Add a delivery location pin at checkout to see your rider’s position on this bar.'
                  : !origin
                    ? 'The restaurant location is not available yet.'
                    : livePosition.state === 'error'
                      ? 'Reconnecting to your rider’s live location…'
                      : 'Waiting for your rider’s live location…'}
        </p>
        <p className="text-center text-xs text-muted-foreground">Tracking connection: {state}</p>
      </section>
    </div>
  )
}
