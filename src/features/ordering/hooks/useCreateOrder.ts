import { useState } from 'react'
import { createCheckout, initializePayment } from '../api/orders.api'
import type { CheckoutValues } from '../schemas/checkout.schema'
import { useCartStore } from '../store/cartStore'

export function useCreateOrder() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentGroupId, setPaymentGroupId] = useState<string | null>(() =>
    sessionStorage.getItem('chopza-pending-payment-group'),
  )

  async function submit(values: CheckoutValues) {
    setPending(true)
    setError(null)
    try {
      const result = await createCheckout(values, useCartStore.getState().items)
      sessionStorage.setItem('chopza-pending-payment-group', result.cartGroupId)
      setPaymentGroupId(result.cartGroupId)
      const { authorization_url } = await initializePayment(result.cartGroupId)
      window.location.assign(authorization_url)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to place order.',
      )
    } finally {
      setPending(false)
    }
  }

  async function retryPayment() {
    const cartGroupId = paymentGroupId ?? sessionStorage.getItem('chopza-pending-payment-group')
    if (!cartGroupId) {
      setError('No unpaid checkout is available to retry. Place your order again.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const { authorization_url } = await initializePayment(cartGroupId)
      window.location.assign(authorization_url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to restart payment.')
    } finally {
      setPending(false)
    }
  }

  return { submit, retryPayment, paymentGroupId, pending, error }
}
