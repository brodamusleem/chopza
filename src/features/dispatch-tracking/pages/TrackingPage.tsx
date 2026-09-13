import { useParams } from 'react-router'
import { z } from 'zod'
import { useOrderStatusChannel } from '../hooks/useOrderStatusChannel'
import { useLiveRiderLocation } from '../hooks/useLiveRiderLocation'
import { LiveMap } from '../components/LiveMap'
import { OrderStatusTimeline } from '../components/OrderStatusTimeline'
export function Component() {
  const { id } = useParams()
  const validId = z.uuid().safeParse(id)
  const { order, error, state } = useOrderStatusChannel(
    validId.success ? validId.data : undefined,
  )
  const { location, state: locationState } = useLiveRiderLocation(
    order?.rider_id ?? undefined,
  )
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
      {error && <p role="alert">{error}</p>}
      <div className="grid gap-7 lg:grid-cols-[2fr_1fr]">
        <LiveMap location={location} />
        <section className="space-y-6 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Order progress</h2>
          <OrderStatusTimeline status={order?.status ?? null} />
          <p role="status" className="text-xs text-muted-foreground">
            Order connection: {state} · Location: {locationState}
          </p>
        </section>
      </div>
    </div>
  )
}
