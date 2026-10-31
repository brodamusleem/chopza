import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import { riderLocationSchema } from '../types'

export type LiveOrderPosition = {
  riderId: string
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

export function useLiveOrderPosition(orderId?: string, riderId?: string) {
  const [location, setLocation] = useState<LiveOrderPosition | null>(null)
  const [state, setState] = useState<
    'idle' | 'connecting' | 'subscribed' | 'error'
  >('idle')

  useEffect(() => {
    if (!supabase || !orderId || !riderId) {
      setLocation(null)
      setState('idle')
      return
    }

    const client = supabase
    let active = true
    setLocation(null)
    setState('connecting')
    const channel = client.channel(`order-tracking-${orderId}`, {
      config: { private: true },
    })

    void client.realtime
      .setAuth()
      .then(() => {
        if (!active) return
        channel
          .on('broadcast', { event: 'position' }, ({ payload }) => {
            const parsed = riderLocationSchema.safeParse(payload)
            if (
              !active ||
              !parsed.success ||
              parsed.data.riderId !== riderId ||
              parsed.data.timestamp > Date.now() + 30000
            ) {
              return
            }

            setState('subscribed')
            setLocation((previous) => {
              if (
                previous?.riderId === riderId &&
                previous.timestamp >= parsed.data.timestamp
              )
                return previous
              return parsed.data
            })
          })
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
  }, [orderId, riderId])

  return { location, state }
}
