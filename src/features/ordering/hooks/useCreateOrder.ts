import { useState } from 'react'
import { createOrder } from '../api/orders.api'
import type { CheckoutValues } from '../schemas/checkout.schema'
import { useCartStore } from '../store/cartStore'
export function useCreateOrder() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(values: CheckoutValues) {
    setPending(true)
    setError(null)
    try {
      await createOrder(values, useCartStore.getState().items)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to place order.',
      )
    } finally {
      setPending(false)
    }
  }
  return { submit, pending, error }
}
