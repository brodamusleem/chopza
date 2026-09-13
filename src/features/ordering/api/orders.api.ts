import type { CheckoutValues } from '../schemas/checkout.schema'
import type { CartItem } from '../types'
export async function createOrder(
  _checkout: CheckoutValues,
  _items: CartItem[],
): Promise<never> {
  // Future server transaction must reprice items and split vendor orders atomically.
  throw new Error(
    'Order placement is not connected yet. No order or payment has been created.',
  )
}
