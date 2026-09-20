import { useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L, { type LatLngExpression } from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const kano: LatLngExpression = [12.0022, 8.592]

function PinDrop({ onChange }: { onChange: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null
  longitude: number | null
  onChange: (latitude: number, longitude: number) => void
}) {
  const [locationError, setLocationError] = useState('')
  const position: LatLngExpression = latitude !== null && longitude !== null ? [latitude, longitude] : kano
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationError('')
        onChange(coords.latitude, coords.longitude)
      },
      () => setLocationError('We could not read your location. You can click the map instead.'),
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Pin your location</p>
          <p className="text-sm text-muted-foreground">Optional, but it helps riders find you.</p>
        </div>
        <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={useCurrentLocation}>
          Use my current location
        </button>
      </div>
      <MapContainer center={position} zoom={13} className="h-64 w-full rounded-lg" scrollWheelZoom>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <PinDrop onChange={onChange} />
        {latitude !== null && longitude !== null && <Marker position={[latitude, longitude]} />}
      </MapContainer>
      {locationError && <p className="text-sm text-destructive">{locationError}</p>}
      {latitude !== null && longitude !== null && <p className="text-xs text-muted-foreground">Pinned at {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>}
    </div>
  )
}
