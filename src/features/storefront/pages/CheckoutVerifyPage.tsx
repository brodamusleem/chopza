import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { requireSupabase } from '@/shared/lib/supabaseClient'
import { useCartStore } from '@/features/ordering/store/cartStore'

export function Component() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('Confirming your payment…')
  const [orderUrl, setOrderUrl] = useState('/orders')
  const isTestMode = import.meta.env.VITE_PAYMENT_MODE === 'test'

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference was provided.')
      return
    }

    let active = true
    async function verify() {
      try {
        const { data, error } = await requireSupabase().functions.invoke('paystack-verify', {
          body: { reference },
        })
        if (!active) return
        if (error) throw new Error(error.message || 'Unable to verify payment.')
        if (data?.verified) {
          useCartStore.getState().clear()
          sessionStorage.removeItem('chopza-pending-payment-group')
          const order = await requireSupabase().from('orders').select('id').eq('cart_group_id', data.cart_group_id).order('created_at', { ascending: true }).limit(1).maybeSingle()
          if (order.data?.id) setOrderUrl(`/orders/${order.data.id}`)
          setStatus('success')
          setMessage('Payment confirmed. Your order is now processing.')
        } else {
          setStatus('failed')
          setMessage(data?.status ? `Payment is still pending or failed: ${String(data.status)}` : 'Payment could not be confirmed.')
          const current = await requireSupabase()
            .from('payments')
            .select('status, cart_group_id')
            .eq('reference', reference)
            .maybeSingle()
          if (current.error) throw new Error(current.error.message)
          if (current.data?.status === 'paid') {
            useCartStore.getState().clear()
            sessionStorage.removeItem('chopza-pending-payment-group')
            const order = await requireSupabase().from('orders').select('id').eq('cart_group_id', current.data.cart_group_id).order('created_at', { ascending: true }).limit(1).maybeSingle()
            if (order.data?.id) setOrderUrl(`/orders/${order.data.id}`)
            setStatus('success')
            setMessage('Payment confirmed. Your order is now processing.')
            return
          }
          if (data?.status === 'abandoned' || data?.status === 'failed') {
            setStatus('failed')
            setMessage(`Payment ${String(data.status)}. You can retry from your order.`)
            return
          }

          setStatus('loading')
          setMessage('Payment is still being confirmed. Checking for the Paystack webhook…')
          for (let attempt = 0; attempt < 15; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 2000))
            if (!active) return
            const poll = await requireSupabase()
              .from('payments')
              .select('status')
              .eq('reference', reference)
              .maybeSingle()
            if (poll.error) throw new Error(poll.error.message)
            if (poll.data?.status === 'paid') {
              useCartStore.getState().clear()
              sessionStorage.removeItem('chopza-pending-payment-group')
              const order = await requireSupabase().from('orders').select('id').eq('cart_group_id', current.data?.cart_group_id ?? '').order('created_at', { ascending: true }).limit(1).maybeSingle()
              if (order.data?.id) setOrderUrl(`/orders/${order.data.id}`)
              setStatus('success')
              setMessage('Payment confirmed. Your order is now processing.')
              return
            }
            if (poll.data?.status === 'failed') {
              setStatus('failed')
              setMessage('Payment failed. You can retry from your order.')
              return
            }
          }
          setStatus('failed')
          setMessage('Payment is still unconfirmed. Your cart is preserved; retry the payment from checkout later.')
        }
      } catch (error) {
        if (!active) return
        setStatus('failed')
        setMessage(error instanceof Error ? error.message : 'Unable to verify payment.')
      }
    }

    void verify()
    return () => {
      active = false
    }
  }, [searchParams])

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTestMode && <Badge variant="secondary">Test mode: no real money will be charged</Badge>}
          <p className={status === 'success' ? 'text-emerald-600' : status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}>{message}</p>
          {status === 'success' && (
            <Button asChild>
              <Link to={orderUrl}>View your order</Link>
            </Button>
          )}
          {status === 'failed' && (
            <Button asChild variant="outline">
              <Link to="/checkout">Back to checkout</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
