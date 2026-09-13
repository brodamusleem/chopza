import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
let configured = false
export async function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('Google Maps is not configured.')
  if (!configured) {
    setOptions({ key, v: 'quarterly' })
    configured = true
  }
  return importLibrary('maps')
}
