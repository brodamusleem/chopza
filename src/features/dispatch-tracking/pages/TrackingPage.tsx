import { useParams } from 'react-router'
import { z } from 'zod'
import { useOrderStatusChannel } from '../hooks/useOrderStatusChannel'
import { useLiveOrderPosition } from '../hooks/useLiveOrderPosition'
import { LiveMap } from '../components/LiveMap'
import { OrderStatusTimeline } from '../components/OrderStatusTimeline'
import { Button } from '@/shared/components/ui/button'
import { initializePayment } from '@/features/ordering/api/orders.api'
import { useState } from 'react'

export function Component() {
  const { id } = useParams()
  const validId = z.uuid().safeParse(id)
  const { order, error, state } = useOrderStatusChannel(
    validId.success ? validId.data : undefined,
  )
  const livePosition = useLiveOrderPosition(
    order?.id,
    order?.rider_id ?? undefined,
  )
  const savedLocation =
    order?.current_lat != null &&
    order.current_lng != null &&
    order.location_updated_at &&
    order.rider_id
      ? {
          riderId: order.rider_id,
          lat: order.current_lat,
          lng: order.current_lng,
          accuracy: 0,
          timestamp: Date.parse(order.location_updated_at),
        }
      : null
  const location = livePosition.location ?? savedLocation
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')

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

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          From kitchen to doorstep
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Track your order</h1>
      </div>

      {!validId.success && (
        <p role="alert">Enter a valid order ID to connect tracking.</p>
      )}

      {order?.payment_status === 'unpaid' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          <p role="status">Awaiting payment</p>
          <Button size="sm" disabled={paying} onClick={() => void payNow()}>{paying ? 'Opening Paystack…' : 'Pay now'}</Button>
        </div>
      )}

      {paymentError && <p role="alert" className="text-sm text-destructive">{paymentError}</p>}

      {error && <p role="alert">{error}</p>}
      <div className="grid gap-7 lg:grid-cols-[2fr_1fr]">
        <LiveMap location={location} />
        <section className="space-y-6 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Order progress</h2>
          <OrderStatusTimeline status={order?.status ?? null} />
          <p role="status" className="text-xs text-muted-foreground">
            Order connection: {state} · Location: {livePosition.state}
          </p>
        </section>
      </div>
    </div>
  )
}
