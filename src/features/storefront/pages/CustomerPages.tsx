import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CircleUserRound, RotateCw, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatNaira } from '@/shared/lib/currency'
import { requireSupabase } from '@/shared/lib/supabaseClient'

type CustomerOrder = {
  id: string
  status: string
  total_amount: number
  payment_status: string
  created_at: string
  vendor: { name: string } | null
}

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true

    async function loadOrders() {
      if (!user) {
        if (active) {
          setOrders([])
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const { data, error: queryError } = await requireSupabase()
          .from('orders')
          .select('id, status, total_amount, payment_status, created_at, vendor:vendors!orders_vendor_id_fkey(name)')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (!active) return
        if (queryError) throw queryError
        setOrders(data ?? [])
      } catch (cause: unknown) {
        if (active) {
          setError(
            cause instanceof Error ? cause : new Error('Unable to load orders.'),
          )
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadOrders()
    return () => {
      active = false
    }
  }, [user?.id, retry])

  if (!user)
    return <div className="mx-auto max-w-lg rounded-3xl border bg-card px-6 py-12 text-center"><ShoppingBag className="mx-auto size-9 text-primary" /><h1 className="mt-4 text-2xl font-semibold">Your orders</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to see your order history.</p><Button asChild className="mt-6 rounded-full"><Link to="/login">Sign in</Link></Button></div>

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8 pt-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Order history</p><h1 className="mt-2 text-3xl font-semibold">My orders</h1></div>
      {error && <div className="rounded-2xl border border-destructive/30 bg-card p-5"><p role="alert" className="text-sm">{error.message}</p><Button variant="outline" className="mt-3" onClick={() => setRetry((value) => value + 1)}><RotateCw />Retry</Button></div>}
      {isLoading ? <p role="status" className="rounded-2xl border p-6 text-sm text-muted-foreground">Loading your orders…</p> : orders.length ? (
        <div className="space-y-3">{orders.map((order) => <Card key={order.id} className="rounded-2xl"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{order.vendor?.name ?? 'Restaurant order'}</h2><Badge variant="secondary">{order.status.replaceAll('_', ' ')}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('en-NG')} · payment {order.payment_status.replaceAll('_', ' ')}</p></div>
          <div className="flex items-center justify-between gap-3 sm:justify-end"><strong>{formatNaira(Math.round(Number(order.total_amount) * 100))}</strong><Button asChild variant="outline" className="rounded-full"><Link to={`/orders/${order.id}`}>Track <ArrowRight /></Link></Button></div>
        </CardContent></Card>)}</div>
      ) : !error ? <div className="rounded-3xl border border-dashed px-6 py-12 text-center"><ShoppingBag className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No orders yet</h2><p className="mt-2 text-sm text-muted-foreground">Your completed checkouts will appear here.</p><Button asChild className="mt-5 rounded-full"><Link to="/explore">Explore restaurants</Link></Button></div> : null}
    </div>
  )
}

export function AccountPage() {
  const { user } = useAuth()
  const name = typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : user?.email ?? 'Customer'
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8 pt-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your profile</p><h1 className="mt-2 text-3xl font-semibold">Account settings</h1></div>
      <Card className="rounded-2xl"><CardContent className="flex items-center gap-4 p-5"><CircleUserRound className="size-8 text-primary" /><div><p className="font-semibold">{name}</p><p className="text-sm text-muted-foreground">{user?.email ?? 'Sign in to view your account details.'}</p></div></CardContent></Card>
      <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Profile editing is not available yet. Your account information is shown here as read-only.</div>
    </div>
  )
}
