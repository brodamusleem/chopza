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
    const paystackSecret = await getPaystackSecret()
    const configuredReturnUrl = Deno.env.get('PAYMENT_RETURN_URL')
    const siteUrl = Deno.env.get('SITE_URL')?.replace(/\/+$/, '')
    const callbackUrl = configuredReturnUrl || (siteUrl ? `${siteUrl}/checkout/verify` : null)
    if (!callbackUrl) throw new Error('PAYMENT_RETURN_URL is not configured.')

    const { userClient, adminClient } = getPaymentClients(request)
    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user?.email) {
      return jsonResponse({ error: 'Sign in with an account that has an email address.' }, 401)
    }

    const body = await request.json()
    const address = typeof body.address === 'string' ? body.address.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const latitude = typeof body.latitude === 'number' && Number.isFinite(body.latitude) && body.latitude >= -90 && body.latitude <= 90
      ? body.latitude
      : null
    const longitude = typeof body.longitude === 'number' && Number.isFinite(body.longitude) && body.longitude >= -180 && body.longitude <= 180
      ? body.longitude
      : null
    const items = Array.isArray(body.items) ? body.items : []
    if (address.length < 10 || items.length === 0 || items.length > 100) {
      return jsonResponse({ error: 'Delivery address or cart is invalid.' }, 400)
    }

    const checkoutItems = items.map((item: { menuItemId?: unknown; quantity?: unknown }) => ({
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
    }))
    if (
      checkoutItems.some(
        (item: { menu_item_id: unknown; quantity: unknown }) =>
          typeof item.menu_item_id !== 'string' ||
          typeof item.quantity !== 'number' ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 50,
      )
    ) {
      return jsonResponse({ error: 'One or more cart quantities are invalid.' }, 400)
    }

    const { data: checkoutData, error: checkoutError } = await userClient.rpc(
      'create_checkout',
      {
        p_items: checkoutItems,
        p_delivery_address: address,
        p_delivery_lat: latitude,
        p_delivery_lng: longitude,
      },
    )
    if (checkoutError) throw checkoutError
    const checkout = checkoutData?.[0]
    const amountNaira = Number(checkout?.out_total)
    const amountKobo = Math.round(amountNaira * 100)
    if (!checkout?.out_cart_group_id || !Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      throw new Error('The server returned an invalid checkout total.')
    }

    const reference = `chopza_${crypto.randomUUID()}`

    const { error: insertError } = await adminClient.from('payments').insert({
      cart_group_id: checkout.out_cart_group_id,
      customer_id: authData.user.id,
      provider: 'paystack',
      reference,
      amount: amountNaira,
      currency: 'NGN',
      status: 'unpaid',
    })
    if (insertError) throw insertError

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: authData.user.email,
        amount: amountKobo,
        currency: 'NGN',
        reference,
        callback_url: callbackUrl,
        metadata: {
          cart_group_id: checkout.out_cart_group_id,
          customer_id: authData.user.id,
          phone,
          cancel_action: callbackUrl,
        },
      }),
    })
    const paystack = await paystackResponse.json()
    if (!paystackResponse.ok || !paystack.status || !paystack.data?.authorization_url) {
      await adminClient
        .from('payments')
        .update({ status: 'failed' })
        .eq('reference', reference)
        .eq('customer_id', authData.user.id)
      throw new Error(paystack.message || 'Paystack could not start the payment.')
    }

    return jsonResponse({
      authorizationUrl: paystack.data.authorization_url,
      cartGroupId: checkout.out_cart_group_id,
      reference,
    })
  } catch (error) {
    console.error('initialize-payment failed:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unable to start payment.' },
      400,
    )
  }
})
