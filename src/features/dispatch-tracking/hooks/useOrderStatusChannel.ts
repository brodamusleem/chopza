import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import { orderSchema } from '@/features/ordering'
import type { z } from 'zod'
import type { ChannelState } from '../types'
type Order = z.infer<typeof orderSchema>
export function useOrderStatusChannel(orderId?: string) {
  const [snapshot, setSnapshot] = useState<{
    id?: string
    order: Order | null
    state: ChannelState
    error: string | null
  }>({ order: null, state: 'idle', error: null })
  useEffect(() => {
    const client = supabase
    if (!client || !orderId) return
    let active = true
    function receive(value: unknown) {
      const parsed = orderSchema.safeParse(value)
      if (!active || !parsed.success || parsed.data.id !== orderId) return
      setSnapshot((previous) =>
        previous.id === orderId &&
        previous.order &&
        Date.parse(previous.order.updated_at) >
          Date.parse(parsed.data.updated_at)
          ? previous
          : {
              id: orderId,
              order: parsed.data,
              state: 'subscribed',
              error: null,
            },
      )
    }
    const channel = client
      .channel(`order:${orderId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => receive(payload.new),
      )
      .subscribe((status) => {
        if (!active) return
        if (status !== 'SUBSCRIBED') {
          setSnapshot((previous) => ({
            id: orderId,
            order: previous.id === orderId ? previous.order : null,
            state: 'error',
            error: 'Order updates disconnected.',
          }))
          return
        }
        // Read AFTER subscribing; repeat on reconnect to recover missed status changes.
        setSnapshot((previous) => ({
          id: orderId,
          order: previous.id === orderId ? previous.order : null,
          state: 'subscribed',
          error: null,
        }))
        void client
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (!active) return
            if (error || !data)
              setSnapshot({
                id: orderId,
                order: null,
                state: 'error',
                error: error?.message ?? 'Order not found or access denied.',
              })
            else receive(data)
          })
      })
    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [orderId])
  return snapshot.id === orderId
    ? snapshot
    : {
        order: null,
        state:
          supabase && orderId ? ('connecting' as const) : ('idle' as const),
        error: null,
      }
}
