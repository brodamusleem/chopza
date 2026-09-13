import { useEffect } from 'react'
import { importLibrary } from '@googlemaps/js-api-loader'
import type { RiderLocation } from '../types'
export function RiderMarker({
  map,
  location,
}: {
  map: google.maps.Map
  location: RiderLocation
}) {
  useEffect(() => {
    let active = true
    let marker: google.maps.marker.AdvancedMarkerElement | undefined
    void importLibrary('marker')
      .then(({ AdvancedMarkerElement }) => {
        if (active)
          marker = new AdvancedMarkerElement({
            map,
            position: { lat: location.lat, lng: location.lng },
            title: 'Delivery rider',
          })
      })
      .catch(() => {
        /* The map still displays; the location timestamp remains available below it. */
      })
    return () => {
      active = false
      if (marker) marker.map = null
    }
  }, [map, location.lat, location.lng])
  return null
}
