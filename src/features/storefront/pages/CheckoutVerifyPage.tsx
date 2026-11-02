import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, Check, Clock3, MapPin, PackageCheck, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { requireSupabase } from '@/shared/lib/supabaseClient'
import { formatNaira } from '@/shared/lib/currency'
import { useCartStore } from '@/features/ordering/store/cartStore'

type ReceiptItem = {
  id: string
  order_id: string
  quantity: number
  unit_price: number
  menu_items: { name: string; image_url: string | null } | null
}

type ReceiptOrder = {
  id: string
  total_amount: number
  created_at: string
}

type Receipt = { orders: ReceiptOrder[]; items: ReceiptItem[] }

async function getFunctionErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = error.context
    if (context instanceof Response) {
      try {
        const body = await context.clone().json() as { error?: string; message?: string }
        const message = body.error || body.message
        if (message) return message
      } catch {
        // Keep the SDK message if the response body is not JSON.
      }
    }
  }
  return error instanceof Error ? error.message : 'Unable to verify payment.'
}

export function Component() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('Confirming your payment…')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const isTestMode = import.meta.env.VITE_PAYMENT_MODE === 'test'

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference was provided.')
      return
    }
    const paymentReference = reference

    let active = true
    const supabase = requireSupabase()

    async function loadReceipt(cartGroupId: string) {
      const { data: orderRows, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .eq('cart_group_id', cartGroupId)
        .order('created_at', { ascending: true })
      if (orderError) throw orderError

      const orders = (orderRows ?? []) as ReceiptOrder[]
      const orderIds = orders.map((order) => order.id)
      const { data: itemRows, error: itemError } = orderIds.length
        ? await supabase
            .from('order_items')
            .select('id, order_id, quantity, unit_price, menu_items(name, image_url)')
            .in('order_id', orderIds)
        : { data: [], error: null }
      if (itemError) throw itemError

      const items = (itemRows ?? []) as unknown as ReceiptItem[]
      if (!active) return
      setReceipt({ orders, items })
      setStatus('success')
      setMessage('Your payment is confirmed and your order is being prepared.')
    }

    async function finishPayment(cartGroupId: string) {
      useCartStore.getState().clear()
      sessionStorage.removeItem('chopza-pending-payment-group')
      await loadReceipt(cartGroupId)
    }

    async function verify() {
      try {
        const { data, error } = await supabase.functions.invoke('paystack-verify', {
          body: { reference: paymentReference },
        })
        if (!active) return
        if (data?.verified && data.cart_group_id) {
          await finishPayment(data.cart_group_id)
          return
        }

        const { data: current, error: currentError } = await supabase
          .from('payments')
          .select('status, cart_group_id')
          .eq('reference', paymentReference)
          .maybeSingle()
        if (currentError) throw currentError
        if (current?.status === 'paid') {
          await finishPayment(current.cart_group_id)
          return
        }
        const verifyErrorMessage = error ? await getFunctionErrorMessage(error) : null
        if (data?.status === 'abandoned' || data?.status === 'failed') {
          setStatus('failed')
          setMessage(`Payment ${String(data.status)}. You can retry from checkout.`)
          return
        }

        setMessage(error
          ? 'Paystack returned you here successfully. We’re checking your saved payment status before showing the result…'
          : 'Your bank has responded. We’re waiting for the final payment confirmation…')
        for (let attempt = 0; attempt < 15; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 2000))
          if (!active) return
          const { data: payment, error: pollError } = await supabase
            .from('payments')
            .select('status, cart_group_id')
            .eq('reference', paymentReference)
            .maybeSingle()
          if (pollError) throw pollError
          if (payment?.status === 'paid') {
            await finishPayment(payment.cart_group_id)
            return
          }
          if (payment?.status === 'failed') {
            setStatus('failed')
            setMessage('This payment could not be confirmed. You can retry from checkout.')
            return
          }
        }
        setStatus('failed')
        setMessage(verifyErrorMessage
          ? `We could not confirm the payment yet: ${verifyErrorMessage}`
          : 'Payment is still unconfirmed. Your cart is safe; please check your orders before trying again.')
      } catch (error) {
        if (!active) return
        setStatus('failed')
        setMessage(await getFunctionErrorMessage(error))
      }
    }

    void verify()
    return () => {
      active = false
    }
  }, [searchParams])

  const total = receipt?.orders.reduce((sum, order) => sum + Number(order.total_amount), 0) ?? 0
  const itemCount = receipt?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-amber-50/80 via-background to-background px-3 py-7 sm:px-4 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {isTestMode && <Badge variant="secondary" className="mb-4">Test mode · no real money charged</Badge>}
        <Card className="overflow-hidden rounded-2xl border-0 shadow-xl shadow-amber-950/10 sm:rounded-3xl">
          <div className={`px-4 pb-7 pt-8 text-center text-white sm:px-10 sm:pb-8 sm:pt-10 ${status === 'success' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : status === 'failed' ? 'bg-gradient-to-br from-rose-600 to-orange-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full border border-white/30 bg-white/15 shadow-inner sm:mb-5 sm:size-20">
              {status === 'success' ? <Check className="size-8 sm:size-10" strokeWidth={3} /> : status === 'failed' ? <Clock3 className="size-8 sm:size-9" /> : <UtensilsCrossed className="size-8 sm:size-9 animate-pulse" />}
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/80">{status === 'success' ? 'Payment complete' : status === 'failed' ? 'Payment update' : 'One moment'}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{status === 'success' ? 'Your meal is on its way!' : status === 'failed' ? 'We couldn’t confirm that' : 'Confirming your payment'}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/85 sm:text-base">{message}</p>
          </div>

          {status === 'success' && receipt && (
            <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/60 p-3 sm:gap-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm sm:size-11"><PackageCheck className="size-5" /></span>
                  <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">Order reference</p><p className="break-all font-mono text-xs font-bold sm:text-sm">{receipt.orders.length === 1 ? receipt.orders[0].id : `${receipt.orders.length} orders`}</p></div>
                </div>
                <Badge className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 hover:bg-emerald-100 sm:px-3"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-600" />Paid</Badge>
              </div>

              <section>
                <div className="mb-3 flex items-center justify-between sm:mb-4"><h2 className="flex items-center gap-2 text-sm font-semibold sm:text-base"><ShoppingBag className="size-4 text-orange-600" />Your order</h2><span className="text-xs text-muted-foreground sm:text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span></div>
                <div className="divide-y rounded-2xl border">
                  {receipt.items.length ? receipt.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 p-3 sm:gap-4 sm:p-4">
                      {item.menu_items?.image_url ? <img src={item.menu_items.image_url} alt="" className="size-11 shrink-0 rounded-xl object-cover sm:size-16" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 sm:size-16"><UtensilsCrossed className="size-5" /></span>}
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium sm:text-base">{item.menu_items?.name ?? 'Menu item'}</p><p className="mt-1 text-xs text-muted-foreground sm:text-sm">Qty {item.quantity} · {formatNaira(Math.round(Number(item.unit_price) * 100))} each</p></div>
                      <p className="max-w-[88px] text-right text-xs font-semibold sm:max-w-none sm:text-sm">{formatNaira(Math.round(Number(item.unit_price) * item.quantity * 100))}</p>
                    </div>
                  )) : <p className="p-5 text-sm text-muted-foreground">Your payment is confirmed. Order items are still loading.</p>}
                </div>
              </section>

              <div className="space-y-2 border-t pt-4">
                {receipt.orders.map((order) => <div key={order.id} className="flex justify-between gap-3 text-xs text-muted-foreground sm:text-sm"><span className="flex min-w-0 items-center gap-2"><MapPin className="size-4 shrink-0" />Order {order.id.slice(0, 8)}</span><span className="shrink-0">{formatNaira(Math.round(Number(order.total_amount) * 100))}</span></div>)}
                <div className="flex items-center justify-between gap-3 pt-2 text-sm font-bold sm:text-base"><span>Total paid</span><span className="shrink-0 text-base text-orange-700 sm:text-lg">{formatNaira(Math.round(total * 100))}</span></div>
              </div>

              <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:gap-3">
                <Button asChild className="h-11 w-full flex-1 rounded-xl bg-orange-600 text-sm font-semibold hover:bg-orange-700 sm:h-12">
                  <Link to={receipt.orders[0]?.id ? `/orders/${receipt.orders[0].id}` : '/orders'}>Track your order <ArrowRight className="ml-2 size-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="h-11 w-full rounded-xl text-sm sm:h-12 sm:w-auto"><Link to="/explore">Order something else</Link></Button>
              </div>
            </CardContent>
          )}

          {status !== 'success' && (
            <CardContent className="p-6 sm:p-8">
              {status === 'loading' ? <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground"><Clock3 className="size-4 animate-pulse" />Please keep this page open while we check.</div> : <Button asChild variant="outline" className="w-full rounded-xl"><Link to="/checkout">Back to checkout</Link></Button>}
            </CardContent>
          )}
        </Card>
        <p className="mt-5 text-center text-xs text-muted-foreground">Thanks for choosing Chopza. We’ll take good care of your order.</p>
      </div>
    </main>
  )
}
