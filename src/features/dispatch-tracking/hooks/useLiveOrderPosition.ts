import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import { riderLocationSchema, riderTopic } from '../types'

export type LiveOrderPosition = {
  riderId: string
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

export function useLiveOrderPosition(orderId?: string, riderId?: string) {
  const [location, setLocation] = useState<LiveOrderPosition | null>(null)
  const [state, setState] = useState<'idle' | 'connecting' | 'subscribed' | 'error'>('idle')

  const topic = useMemo(
    () => (riderId ? riderTopic(riderId) : null),
    [riderId],
  )

  useEffect(() => {
    if (!supabase || !orderId || !riderId || !topic) {
      setLocation(null)
      setState('idle')
      return
    }

    const client = supabase
    let active = true
    const channel = client.channel(topic, { config: { private: true } })

    void client.realtime
      .setAuth()
      .then(() => {
        if (!active) return
        channel
          .on(
            'broadcast',
            { event: 'location' },
            ({ payload }) => {
              const parsed = riderLocationSchema.safeParse(payload)
              if (!active || !parsed.success || parsed.data.riderId !== riderId) {
                return
              }

              setLocation({
                riderId: parsed.data.riderId,
                lat: parsed.data.lat,
                lng: parsed.data.lng,
                accuracy: parsed.data.accuracy,
                timestamp: parsed.data.timestamp,
              })
              setState('subscribed')
            },
          )
          .subscribe((status) => {
            if (!active) return
            setState(status === 'SUBSCRIBED' ? 'subscribed' : 'error')
          })
      })
      .catch(() => {
        if (active) setState('error')
      })

    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [orderId, riderId, topic])

  return { location, state }
}
