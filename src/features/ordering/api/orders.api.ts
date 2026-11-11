import type { CheckoutValues } from '../schemas/checkout.schema'
import type { CartItem } from '../types'
import { requireSupabase } from '@/shared/lib/supabaseClient'

export type CheckoutPaymentResult = {
  cartGroupId: string
  authorizationUrl: string
  reference: string
}

export async function initializeCheckoutPayment(
  checkout: CheckoutValues,
  items: CartItem[],
): Promise<CheckoutPaymentResult> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke<{
    authorizationUrl?: string
    cartGroupId?: string
    reference?: string
  }>('initialize-payment', {
    body: {
      address: checkout.address,
      phone: checkout.phone,
      notes: checkout.notes?.trim() || null,
      latitude: checkout.latitude ?? null,
      longitude: checkout.longitude ?? null,
      items: items.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
    },
  })
  if (error) throw new Error(error.message || 'Unable to start Paystack payment.')
  if (!data?.authorizationUrl || !data.cartGroupId || !data.reference) {
    throw new Error('Payment initialization returned incomplete checkout details.')
  }
  return {
    authorizationUrl: data.authorizationUrl,
    cartGroupId: data.cartGroupId,
    reference: data.reference,
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

export async function cancelUnassignedOrder(orderId: string): Promise<void> {
  const { error } = await requireSupabase().rpc('cancel_unassigned_order', {
    target_order_id: orderId,
  })
  if (error) throw new Error(error.message || 'Unable to cancel this order.')
}
