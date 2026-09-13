import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { loadGoogleMaps } from '@/shared/lib/googleMaps'
import type { RiderLocation } from '../types'
import { RiderMarker } from './RiderMarker'
const kano = { lat: 12.0022, lng: 8.592 }
export function LiveMap({ location }: { location: RiderLocation | null }) {
  const container = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [error, setError] = useState<string | null>(null)
  const configured = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
  useEffect(() => {
    if (!configured) return
    let active = true
    let instance: google.maps.Map | undefined
    void loadGoogleMaps()
      .then(({ Map }) => {
        if (!active || !container.current) return
        instance = new Map(container.current, {
          center: kano,
          zoom: 13,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
          streetViewControl: false,
          mapTypeControl: false,
        })
        setMap(instance)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'Map could not load.',
          )
      })
    return () => {
      active = false
      if (instance) google.maps.event.clearInstanceListeners(instance)
    }
  }, [configured])
  useEffect(() => {
    if (map && location) map.panTo({ lat: location.lat, lng: location.lng })
  }, [map, location])
  return (
    <section className="overflow-hidden rounded-2xl border">
      <div className="relative bg-secondary">
        <div
          ref={container}
          className="h-96 w-full"
          aria-label="Google Map showing delivery location in Kano"
        />
        {(!configured || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <MapPin size={36} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Your delivery, on the map</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error ??
                'Google Maps will appear here once its API key is configured.'}
            </p>
          </div>
        )}
      </div>
      {map && location && <RiderMarker map={map} location={location} />}
      <p className="border-t bg-card p-4 text-sm text-muted-foreground">
        {location
          ? `Last location: ${new Date(location.timestamp).toLocaleTimeString()} · Accuracy ${Math.round(location.accuracy)} m`
          : 'Waiting for an assigned rider to share a live location.'}
      </p>
    </section>
  )
}
