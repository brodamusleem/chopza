import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import {
  riderLocationSchema,
  riderTopic,
  type RiderLocation,
  type ChannelState,
} from '../types'
export function useLiveRiderLocation(riderId?: string) {
  const [snapshot, setSnapshot] = useState<{
    id?: string
    location: RiderLocation | null
    state: ChannelState
  }>({ location: null, state: 'idle' })
  useEffect(() => {
    const client = supabase
    if (!client || !riderId) return
    let active = true
    const channel = client.channel(riderTopic(riderId), {
      config: { private: true },
    })
    void client.realtime
      .setAuth()
      .then(() => {
        if (!active) return
        channel
          .on(
            'broadcast',
            { event: 'location' },
            ({ payload }: { payload: unknown }) => {
              const parsed = riderLocationSchema.safeParse(payload)
              if (
                !active ||
                !parsed.success ||
                parsed.data.riderId !== riderId ||
                parsed.data.timestamp > Date.now() + 30000
              )
                return
              setSnapshot((previous) =>
                previous.id === riderId &&
                previous.location &&
                previous.location.timestamp >= parsed.data.timestamp
                  ? previous
                  : { id: riderId, location: parsed.data, state: 'subscribed' },
              )
            },
          )
          .subscribe((status) => {
            if (active)
              setSnapshot((previous) => ({
                id: riderId,
                location: previous.id === riderId ? previous.location : null,
                state: status === 'SUBSCRIBED' ? 'subscribed' : 'error',
              }))
          })
      })
      .catch(() => {
        if (active) setSnapshot({ id: riderId, location: null, state: 'error' })
      })
    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [riderId])
  return snapshot.id === riderId
    ? snapshot
    : {
        location: null,
        state:
          supabase && riderId ? ('connecting' as const) : ('idle' as const),
      }
}
