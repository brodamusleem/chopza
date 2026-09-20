import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { ActiveDispatchOrder } from '../hooks/useActiveDispatchOrders'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const kanoCenter: [number, number] = [12.0022, 8.592]

type DispatchMapProps = {
  orders: ActiveDispatchOrder[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  livePositions: Record<string, { lat: number; lng: number; timestamp: number }>
}

function MapViewport({ points, selectedId }: { points: { id: string; lat: number; lng: number }[]; selectedId: string | null }) {
  const map = useMap()
  useEffect(() => {
    const selected = points.find((point) => point.id === selectedId) ?? points[0]
    if (selected) map.flyTo([selected.lat, selected.lng], 14, { duration: 0.8 })
  }, [map, points, selectedId])
  return null
}

export function DispatchMap({ orders, selectedId, onSelect, livePositions }: DispatchMapProps) {
  const points = orders
    .filter((order) => order.current_lat != null && order.current_lng != null)
    .map((order) => ({
      id: order.id,
      lat: livePositions[order.id]?.lat ?? order.current_lat!,
      lng: livePositions[order.id]?.lng ?? order.current_lng!,
      title: `${order.vendor_name ?? 'Vendor'} · ${order.customer_name ?? 'Customer'}`,
      status: order.status,
    }))

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Live dispatch map</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Active rider routes in Kano</p>
        </div>
        <Badge variant="outline">{orders.length} active</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <MapContainer center={kanoCenter} zoom={12} scrollWheelZoom className="h-[420px] w-full overflow-hidden rounded-xl border bg-muted" aria-label="OpenStreetMap showing active dispatches">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport points={points} selectedId={selectedId} />
          {points.map((point) => (
            <Marker key={point.id} position={[point.lat, point.lng]} eventHandlers={{ click: () => onSelect(point.id) }}>
              <Popup><strong>{point.title}</strong><br />{point.status}</Popup>
            </Marker>
          ))}
        </MapContainer>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No active deliveries right now.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {points.map((point) => (
              <Button key={point.id} size="sm" variant={selectedId === point.id ? 'default' : 'outline'} onClick={() => onSelect(point.id)}>
                {point.title}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
