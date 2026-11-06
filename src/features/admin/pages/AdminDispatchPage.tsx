import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, PlayCircle, RefreshCw, Store } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { DispatchMap } from '@/features/dispatch-tracking/components/DispatchMap'
import { DispatchSimulator } from '@/features/dispatch-tracking/components/DispatchSimulator'
import { useActiveDispatchOrders } from '@/features/dispatch-tracking/hooks/useActiveDispatchOrders'
import { useLiveOrderPosition } from '@/features/dispatch-tracking/hooks/useLiveOrderPosition'
import { requireSupabase } from '@/shared/lib/supabaseClient'
import { toast } from 'sonner'
import {
  getApprovedVendorChoices,
  getUnacceptedPaidOrders,
  reassignOrderToVendor,
  type AdminUnacceptedOrder,
} from '../api/admin.api'

export function AdminDispatchPage() {
  const { orders, isLoading, error, refetch } = useActiveDispatchOrders()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [unacceptedOrders, setUnacceptedOrders] = useState<AdminUnacceptedOrder[]>([])
  const [vendorChoices, setVendorChoices] = useState<{ id: string; name: string }[]>([])
  const [transferChoices, setTransferChoices] = useState<Record<string, string>>({})
  const [transferring, setTransferring] = useState<string>()
  const [livePositions, setLivePositions] = useState<
    Record<string, { lat: number; lng: number; timestamp: number }>
  >({})
  const activeOrder =
    orders.find((order) => order.id === selectedId) ?? orders[0] ?? null
  const livePosition = useLiveOrderPosition(
    activeOrder?.id,
    activeOrder?.rider_id ?? undefined,
  )

  const loadUnaccepted = useCallback(async () => {
    try {
      const [ordersToReview, vendors] = await Promise.all([
        getUnacceptedPaidOrders(), getApprovedVendorChoices(),
      ])
      setUnacceptedOrders(ordersToReview)
      setVendorChoices(vendors)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to load orders needing review.')
    }
  }, [])

  useEffect(() => {
    void loadUnaccepted()
    const client = requireSupabase()
    const channel = client.channel('admin-dispatch-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'app_notifications',
      }, (payload) => {
        const note = payload.new as { recipient_id?: string; title?: string; body?: string }
        if (note.recipient_id && note.title) toast.warning(note.title, { description: note.body })
        void loadUnaccepted()
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
      }, () => void loadUnaccepted())
      .subscribe()
    return () => { void client.removeChannel(channel) }
  }, [loadUnaccepted])

  const transferOrder = async (order: AdminUnacceptedOrder) => {
    const targetVendorId = transferChoices[order.id]
    if (!targetVendorId) return
    setTransferring(order.id)
    try {
      await reassignOrderToVendor(order.id, targetVendorId)
      toast.success('Order transferred. The new restaurant has been notified in the app.')
      await loadUnaccepted()
      await refetch()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to transfer this order.')
    } finally {
      setTransferring(undefined)
    }
  }

  useEffect(() => {
    if (!selectedId && orders.length > 0) {
      setSelectedId(orders[0].id)
    }
  }, [orders, selectedId])

  useEffect(() => {
    if (!activeOrder || !livePosition.location) return
    const position = livePosition.location
    setLivePositions((previous) => ({
      ...previous,
      [activeOrder.id]: {
        lat: position.lat,
        lng: position.lng,
        timestamp: position.timestamp,
      },
    }))
  }, [activeOrder, livePosition.location])

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Operations center
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Live Dispatch Map
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{orders.length} active orders</Badge>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <PlayCircle className="size-4" /> Dispatch queue
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4 text-destructive">
            <AlertCircle className="size-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="size-5 text-destructive" />Orders needing restaurant review</CardTitle>
          <p className="text-sm text-muted-foreground">These paid orders were not accepted by the restaurant within five minutes. Choose another approved restaurant to transfer an order. Confirm it can prepare the existing items first; the order items and price stay the same.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {unacceptedOrders.map((order) => {
            const alternatives = vendorChoices.filter((vendor) => vendor.id !== order.vendorId)
            return <div key={order.id} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-medium">Order #{order.id.slice(0, 8)} · {order.customerName}</p>
                <p className="text-sm text-muted-foreground">Current restaurant: {order.vendorName} · {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  aria-label={`Choose restaurant for order ${order.id.slice(0, 8)}`}
                  className="h-10 min-w-56 rounded-md border bg-background px-3 text-sm"
                  value={transferChoices[order.id] ?? ''}
                  onChange={(event) => setTransferChoices((previous) => ({ ...previous, [order.id]: event.target.value }))}
                >
                  <option value="">Choose a restaurant</option>
                  {alternatives.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
                <Button disabled={!transferChoices[order.id] || transferring === order.id} onClick={() => void transferOrder(order)}>
                  {transferring === order.id ? 'Transferring…' : 'Transfer order'}
                </Button>
              </div>
            </div>
          })}
          {!unacceptedOrders.length && <p className="py-3 text-sm text-muted-foreground">No paid orders are waiting for restaurant review.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_0.9fr]">
        <DispatchMap
          orders={orders}
          selectedId={selectedId}
          onSelect={setSelectedId}
          livePositions={livePositions}
        />

        <div className="space-y-6">
          <DispatchSimulator
            enabled={simulating}
            onToggle={setSimulating}
            initialPoint={
              activeOrder?.current_lat != null &&
              activeOrder.current_lng != null
                ? { lat: activeOrder.current_lat, lng: activeOrder.current_lng }
                : undefined
            }
            onTick={(point) => {
              if (!activeOrder) return
              setLivePositions((previous) => ({
                ...previous,
                [activeOrder.id]: {
                  lat: point.lat,
                  lng: point.lng,
                  timestamp: Date.now(),
                },
              }))
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Selected dispatch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeOrder ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Order</p>
                    <p className="font-semibold">{activeOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium">
                      {activeOrder.vendor_name ?? 'Unknown vendor'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">
                      {activeOrder.customer_name ?? 'Unknown customer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery</p>
                    <p className="font-medium">
                      {activeOrder.delivery_address ?? 'No address recorded'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge>{activeOrder.status}</Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No order selected.
                </p>
              )}

              <Button
                variant="secondary"
                className="w-full gap-2"
                disabled={!activeOrder}
              >
                Open route details
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading dispatch feed…
          </CardContent>
        </Card>
      )}
    </section>
  )
}
