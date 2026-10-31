import type { CheckoutValues } from '../schemas/checkout.schema'
import type { CartItem } from '../types'
import { requireSupabase } from '@/shared/lib/supabaseClient'

export type CheckoutResult = {
  cartGroupId: string
  orderId: string
  total: number
}

export async function createCheckout(
  checkout: CheckoutValues,
  items: CartItem[],
): Promise<CheckoutResult> {
  const supabase = requireSupabase()
  const payload = {
    p_items: items.map(({ menuItemId, quantity }) => ({
      menu_item_id: menuItemId,
      quantity,
    })),
    p_delivery_address: checkout.address,
    p_delivery_lat: checkout.latitude ?? 0,
    p_delivery_lng: checkout.longitude ?? 0,
  }

  const { data, error } = await supabase.rpc('create_checkout', payload)
  if (error) throw new Error(error.message || 'Unable to place order.')

  const firstRow = Array.isArray(data) ? data[0] : null
  const cartGroupId = firstRow?.out_cart_group_id
  if (!cartGroupId) throw new Error('Checkout succeeded but returned no order reference.')

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('cart_group_id', cartGroupId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (orderError) throw new Error(orderError.message || 'Unable to find your order.')

  return {
    cartGroupId,
    orderId: orderData?.id ?? cartGroupId,
    total: Number(firstRow?.out_total ?? 0),
  }
}

export async function initializePayment(
  cartGroupId: string,
): Promise<{ authorization_url: string; reference: string }> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke<{ authorization_url?: string; reference?: string }>('paystack-initialize', {
    body: { cart_group_id: cartGroupId },
  })
  if (error) throw new Error(error.message || 'Unable to start Paystack payment.')
  if (!data?.authorization_url || !data?.reference) {
    throw new Error('Paystack did not return a valid checkout URL.')
  }
  return { authorization_url: data.authorization_url, reference: data.reference }
}

export async function verifyPayment(reference: string): Promise<{ verified: boolean; status?: string; cartGroupId?: string }> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke<{ verified?: boolean; status?: string; cart_group_id?: string }>('paystack-verify', {
    body: { reference },
  })
  if (error) throw new Error(error.message || 'Unable to verify payment.')
  if (!data) throw new Error('Payment verification returned no result.')
  return {
    verified: Boolean(data.verified),
    status: data.status,
    cartGroupId: data.cart_group_id,
  }
}
