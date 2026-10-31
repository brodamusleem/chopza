import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function handleOptions(request: Request) {
  return request.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null
}

async function getUserClient(request: Request) {
  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) throw new Error('Missing bearer token.')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) throw new Error('Supabase environment is not configured.')
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) throw new Error('Supabase service role is not configured.')
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function getPaystackSecret() {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.')
  return secret
}

Deno.serve(async (request) => {
  const options = handleOptions(request)
  if (options) return options
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  try {
    const userClient = await getUserClient(request)
    const adminClient = await getAdminClient()
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Sign in to continue.' }, 401)

    const body = await request.json()
    const cartGroupId = typeof body.cart_group_id === 'string' ? body.cart_group_id : null
    if (!cartGroupId) return jsonResponse({ error: 'Cart group is missing.' }, 400)

    const { data: orderRows, error: orderError } = await adminClient
      .from('orders')
      .select('id, total_amount, payment_status, customer_id')
      .eq('cart_group_id', cartGroupId)
      .eq('customer_id', userData.user.id)

    if (orderError) throw orderError
    if (!orderRows || !orderRows.length) return jsonResponse({ error: 'This cart is not yours.' }, 403)
    if (orderRows.some((order) => order.payment_status !== 'unpaid')) {
      return jsonResponse({ error: 'This order is no longer awaiting payment.' }, 409)
    }

    const totalAmount = orderRows.reduce((sum, order) => sum + Number(order.total_amount), 0)
    const amountKobo = Math.round(totalAmount * 100)
    const reference = `chz_${crypto.randomUUID()}`
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    const { error: paymentInsertError } = await adminClient.from('payments').insert({
      cart_group_id: cartGroupId,
      customer_id: userData.user.id,
      provider: 'paystack',
      reference,
      amount: totalAmount,
      currency: 'NGN',
      status: 'unpaid',
    })
    if (paymentInsertError) throw paymentInsertError

    const paystackSecret = await getPaystackSecret()
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.user.email,
        amount: amountKobo,
        currency: 'NGN',
        reference,
        callback_url: `${siteUrl}/checkout/verify?reference=${encodeURIComponent(reference)}`,
        metadata: {
          cart_group_id: cartGroupId,
          customer_id: userData.user.id,
        },
      }),
    })
    const paystackResult = await paystackResponse.json()
    if (!paystackResponse.ok || !paystackResult.status || !paystackResult.data?.authorization_url) {
      await adminClient.from('payments').update({ status: 'failed' }).eq('reference', reference)
      throw new Error(paystackResult.message || 'Paystack could not initialize the payment.')
    }

    return jsonResponse({ authorization_url: paystackResult.data.authorization_url, reference })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to initialize Paystack payment.' }, 400)
  }
})
