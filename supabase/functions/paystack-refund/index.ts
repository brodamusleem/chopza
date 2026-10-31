import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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

Deno.serve(async (request) => {
  const options = handleOptions(request)
  if (options) return options
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  try {
    const userClient = await getUserClient(request)
    const adminClient = await getAdminClient()
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Sign in to continue.' }, 401)

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (profile?.role !== 'admin') return jsonResponse({ error: 'Admin access required.' }, 403)

    const body = await request.json()
    const orderId = typeof body.order_id === 'string' ? body.order_id : null
    if (!orderId) return jsonResponse({ error: 'Order id is required.' }, 400)

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, cart_group_id, total_amount, payment_status')
      .eq('id', orderId)
      .maybeSingle()
    if (orderError) throw orderError
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404)
    if (order.payment_status !== 'refund_pending') return jsonResponse({ error: 'This order is not waiting for a refund.' }, 409)

    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, reference, amount, status')
      .eq('cart_group_id', order.cart_group_id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (paymentError) throw paymentError
    if (!payment || payment.status !== 'paid') return jsonResponse({ error: 'No successful payment is linked to this order.' }, 409)

    const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.')

    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: payment.reference,
        amount: Math.round(Number(order.total_amount) * 100),
      }),
    })
    const result = await response.json()
    if (!response.ok || !result.status) {
      throw new Error(result.message || 'Paystack refund failed.')
    }

    const { error: refundError } = await adminClient
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', orderId)
    if (refundError) throw refundError

    return jsonResponse({ success: true, order_id: orderId }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to refund this order.' }, 400)
  }
})
