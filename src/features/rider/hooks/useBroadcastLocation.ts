import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import { riderLocationSchema, riderTopic } from '@/features/dispatch-tracking'
/** Explicit opt-in only. No background tracking before a rider starts sharing. */
export function useBroadcastLocation(
  riderId: string | undefined,
  enabled: boolean,
) {
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const client = supabase
    if (!client || !riderId || !enabled) return
    let active = true
    let watch: number | undefined
    let lastSent = 0
    const channel = client.channel(riderTopic(riderId), {
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
          setError(null)
          if (!navigator.geolocation) {
            setError('Geolocation is not supported.')
            return
          }
          if (watch !== undefined) return
          watch = navigator.geolocation.watchPosition(
            (position) => {
              if (!active || Date.now() - lastSent < 3000) return
              const payload = riderLocationSchema.safeParse({
                riderId,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              })
              if (!payload.success) return
              lastSent = Date.now()
              void channel
                .send({
                  type: 'broadcast',
                  event: 'location',
                  payload: payload.data,
                })
                .then((result) => {
                  if (active)
                    setError(
                      result === 'ok'
                        ? null
                        : 'Location update could not be sent.',
                    )
                })
                .catch(() => {
                  if (active) setError('Location update could not be sent.')
                })
            },
            (failure) => {
              if (active) setError(failure.message)
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
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
  }, [riderId, enabled])
  return {
    error: enabled
      ? !supabase
        ? 'Connect Supabase before sharing location.'
        : error
      : null,
  }
}
