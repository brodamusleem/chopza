import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, PlayCircle, RefreshCw } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { DispatchMap } from '@/features/dispatch-tracking/components/DispatchMap'
import { DispatchSimulator } from '@/features/dispatch-tracking/components/DispatchSimulator'
import { useActiveDispatchOrders } from '@/features/dispatch-tracking/hooks/useActiveDispatchOrders'
import { useLiveOrderPosition } from '@/features/dispatch-tracking/hooks/useLiveOrderPosition'

export function AdminDispatchPage() {
  const { orders, isLoading, error, refetch } = useActiveDispatchOrders()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [livePositions, setLivePositions] = useState<
    Record<string, { lat: number; lng: number; timestamp: number }>
  >({})
  const activeOrder = orders.find((order) => order.id === selectedId) ?? orders[0] ?? null
  const livePosition = useLiveOrderPosition(activeOrder?.id, activeOrder?.rider_id ?? undefined)

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
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-primary">Operations center</p>
          <h1 className="text-3xl font-semibold tracking-tight">Live Dispatch Map</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{orders.length} active orders</Badge>
          <Button variant="outline" className="gap-2" onClick={() => void refetch()} disabled={isLoading}>
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
              activeOrder?.current_lat != null && activeOrder.current_lng != null
                ? { lat: activeOrder.current_lat, lng: activeOrder.current_lng }
                : undefined
            }
            onTick={(point) => {
              if (!activeOrder) return
              setLivePositions((previous) => ({
                ...previous,
                [activeOrder.id]: { lat: point.lat, lng: point.lng, timestamp: Date.now() },
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
                    <p className="font-medium">{activeOrder.vendor_name ?? 'Unknown vendor'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{activeOrder.customer_name ?? 'Unknown customer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery</p>
                    <p className="font-medium">{activeOrder.delivery_address ?? 'No address recorded'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge>{activeOrder.status}</Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No order selected.</p>
              )}

              <Button variant="secondary" className="w-full gap-2" disabled={!activeOrder}>
                Open route details
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading dispatch feed…</CardContent>
        </Card>
      )}
    </section>
  )
}
