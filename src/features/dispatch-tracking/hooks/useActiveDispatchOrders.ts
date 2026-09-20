import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'

const activeStatuses = ['rider_assigned', 'picked_up', 'in_transit'] as const

export type ActiveDispatchOrder = {
  id: string
  status: string
  rider_id: string | null
  delivery_address: string | null
  customer_name: string | null
  vendor_name: string | null
  current_lat: number | null
  current_lng: number | null
  location_updated_at: string | null
}

export function useActiveDispatchOrders() {
  const [refreshToken, setRefreshToken] = useState(0)
  const [state, setState] = useState<{
    orders: ActiveDispatchOrder[]
    isLoading: boolean
    error: string | null
  }>({ orders: [], isLoading: true, error: null })

  useEffect(() => {
    const client = supabase
    if (!client) {
      setState({ orders: [], isLoading: false, error: null })
      return
    }

    let active = true

    const readOrders = async () => {
      const { data, error } = await client
        .from('orders')
        .select(
          'id, status, rider_id, delivery_address, current_lat, current_lng, location_updated_at, customer:profiles!orders_customer_id_fkey(full_name), vendor:vendors(name)',
        )
        .in('status', activeStatuses)
        .order('location_updated_at', { ascending: false })
        .limit(50)

      if (!active) return

      if (error) {
        setState({ orders: [], isLoading: false, error: error.message })
        return
      }

      setState({
        orders:
          data?.map((order) => ({
            id: order.id,
            status: order.status,
            rider_id: order.rider_id,
            delivery_address: order.delivery_address,
            customer_name: order.customer?.full_name ?? 'Customer',
            vendor_name: order.vendor?.name ?? 'Vendor',
            current_lat: order.current_lat,
            current_lng: order.current_lng,
            location_updated_at: order.location_updated_at,
          })) ?? [],
        isLoading: false,
        error: null,
      })
    }

    void readOrders()

    const channel = client
      .channel('admin:dispatch-orders', {
        config: { private: true },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async () => {
          await readOrders()
        },
      )
      .subscribe((status) => {
        if (!active) return
        if (status !== 'SUBSCRIBED') {
          setState((previous) => ({
            ...previous,
            isLoading: false,
            error: 'Dispatch feed disconnected.',
          }))
        }
      })

    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [refreshToken])

  return { ...state, refetch: () => setRefreshToken((value) => value + 1) }
}
