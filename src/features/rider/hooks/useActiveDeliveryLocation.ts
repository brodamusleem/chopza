import { useEffect, useState } from 'react'
import { requireSupabase } from '@/shared/lib/supabaseClient'
import { riderLocationSchema } from '@/features/dispatch-tracking/types'
import { updateOrderLocation } from '../api/rider.api'
export function useActiveDeliveryLocation(
  orderId?: string,
  riderId?: string,
) {
  const [error, setError] = useState<string>()
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!orderId || !riderId) return
    const client = requireSupabase()
    let active = true
    let watch: number | undefined
    let lastWrite = 0
    let lastSent = 0
    const channel = client.channel(`order-tracking-${orderId}`, {
      config: { private: true },
    })
    const stopWatch = () => {
      if (watch !== undefined) navigator.geolocation.clearWatch(watch)
      watch = undefined
    }
    void client.realtime
      .setAuth()
      .then(() => {
        if (!active) return
        channel.subscribe((status) => {
          if (!active) return
          if (status !== 'SUBSCRIBED') {
            stopWatch()
            setError('Location channel disconnected.')
            return
          }
          setError(undefined)
          if (!navigator.geolocation) {
            setError('Geolocation is not supported.')
            return
          }
          if (watch !== undefined) return
          watch = navigator.geolocation.watchPosition(
            (position) => {
              if (!active) return
              const lat = position.coords.latitude
              const lng = position.coords.longitude
              if (Date.now() - lastSent >= 3000) {
                const payload = riderLocationSchema.safeParse({
                  riderId,
                  lat,
                  lng,
                  accuracy: position.coords.accuracy,
                  timestamp: position.timestamp,
                })
                if (payload.success) {
                  lastSent = Date.now()
                  void channel.send({
                    type: 'broadcast',
                    event: 'position',
                    payload: payload.data,
                  }).then((result) => {
                    if (active && result !== 'ok')
                      setError('Location update could not be sent.')
                  }).catch(() => {
                    if (active) setError('Location update could not be sent.')
                  })
                }
              }
              if (Date.now() - lastWrite >= 15000) {
                lastWrite = Date.now()
                void updateOrderLocation(orderId, lat, lng).catch(() => {
                  if (active) setError('Could not save your location.')
                })
              }
            },
            (failure) => {
              if (active) setError(failure.message)
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
          )
        })
      })
      .catch(() => {
        if (active) setError('Could not authorize the location channel.')
      })
    return () => {
      active = false
      stopWatch()
      void client.removeChannel(channel)
    }
  }, [orderId, riderId, retry])
  return {
    error,
    retry: () => {
      setError(undefined)
      setRetry((value) => value + 1)
    },
  }
}
