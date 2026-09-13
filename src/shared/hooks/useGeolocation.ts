import { useEffect, useState } from 'react'
export function useGeolocation(enabled = false) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    if (!navigator.geolocation) return
    const watch = navigator.geolocation.watchPosition(
      setPosition,
      (failure) => setError(failure.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [enabled])
  return {
    position: enabled ? position : null,
    error:
      enabled && !navigator.geolocation
        ? 'Geolocation is not supported.'
        : error,
  }
}
