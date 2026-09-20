import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { RiderLocation } from '../types'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const kanoCenter: [number, number] = [12.0022, 8.592]

function FollowLocation({ location }: { location: RiderLocation | null }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.panTo([location.lat, location.lng])
  }, [location, map])
  return null
}

export function LiveMap({ location }: { location: RiderLocation | null }) {
  return (
    <section className="overflow-hidden rounded-2xl border">
      <MapContainer center={kanoCenter} zoom={13} scrollWheelZoom className="h-96 w-full" aria-label="OpenStreetMap showing delivery location in Kano">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FollowLocation location={location} />
        {location && <Marker position={[location.lat, location.lng]}><Popup>Delivery rider</Popup></Marker>}
      </MapContainer>
      <p className="border-t bg-card p-4 text-sm text-muted-foreground">
        {location
          ? `Last location: ${new Date(location.timestamp).toLocaleTimeString()} · Accuracy ${Math.round(location.accuracy)} m`
          : 'Waiting for an assigned rider to share a live location.'}
      </p>
    </section>
  )
}
