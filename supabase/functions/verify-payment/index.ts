import {
  getPaystackSecret,
  getPaymentClients,
  handleOptions,
  jsonResponse,
} from '../_shared/payments.ts'

Deno.serve(async (request) => {
  const options = handleOptions(request)
  if (options) return options
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  try {
    const { userClient, adminClient } = getPaymentClients(request)
    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) return jsonResponse({ error: 'Sign in to verify payment.' }, 401)

    const body = await request.json()
    const reference = typeof body.reference === 'string' ? body.reference : ''
    if (!/^chopza_[0-9a-f-]{36}$/i.test(reference)) {
      return jsonResponse({ error: 'Payment reference is invalid.' }, 400)
    }

    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('cart_group_id, customer_id, amount, currency, status')
      .eq('reference', reference)
      .eq('customer_id', authData.user.id)
      .maybeSingle()
    if (paymentError) throw paymentError
    if (!payment) return jsonResponse({ error: 'Payment was not found.' }, 404)

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${await getPaystackSecret()}` } },
    )
    const result = await response.json()
    if (!response.ok || !result.status || !result.data) {
      throw new Error(result.message || 'Unable to verify payment with Paystack.')
    }

    const transaction = result.data
    const expectedKobo = Math.round(Number(payment.amount) * 100)
    const validTransaction =
      transaction.status === 'success' &&
      transaction.reference === reference &&
      transaction.currency === payment.currency &&
      transaction.amount === expectedKobo

    if (!validTransaction) {
      if (transaction.status === 'failed' || transaction.status === 'abandoned') {
        const { error: updateError } = await adminClient
          .from('payments')
          .update({ status: 'failed' })
          .eq('reference', reference)
          .eq('customer_id', authData.user.id)
          .neq('status', 'paid')
        if (updateError) throw updateError
      }
      return jsonResponse({ verified: false, status: transaction.status || 'pending' })
    }

    const paidAt = transaction.paid_at || new Date().toISOString()
    const { error: ordersError } = await adminClient
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('cart_group_id', payment.cart_group_id)
      .eq('customer_id', authData.user.id)
      .eq('payment_method', 'online')
    if (ordersError) throw ordersError

    const { error: updateError } = await adminClient
      .from('payments')
      .update({ status: 'paid', paid_at: paidAt })
      .eq('reference', reference)
      .eq('customer_id', authData.user.id)
    if (updateError) throw updateError

    return jsonResponse({ verified: true, cartGroupId: payment.cart_group_id })
  } catch (error) {
    console.error('verify-payment failed:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unable to verify payment.' },
      400,
    )
  }
})