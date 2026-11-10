import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L, { type LatLngExpression } from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const kanoCenter: LatLngExpression = [12.0022, 8.592]

function MapBehavior({
  pin,
  onPin,
}: {
  pin: [number, number] | null
  onPin: (pin: [number, number]) => void
}) {
  const map = useMap()
  useEffect(() => {
    if (pin) map.setView(pin, Math.max(map.getZoom(), 14))
  }, [map, pin])
  useMapEvents({
    click(event) {
      onPin([event.latlng.lat, event.latlng.lng])
    },
  })
  return pin ? <Marker position={pin} /> : null
}

export function CustomerLocationMap({
  pin,
  onPin,
}: {
  pin: [number, number] | null
  onPin: (pin: [number, number]) => void
}) {
  return (
    <MapContainer center={pin ?? kanoCenter} zoom={13} className="h-52 w-full rounded-xl" scrollWheelZoom>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBehavior pin={pin} onPin={onPin} />
    </MapContainer>
  )
}
