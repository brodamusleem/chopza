import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function handleOptions(request: Request) {
  return request.method === 'OPTIONS'
    ? new Response('ok', { headers: corsHeaders })
    : null
}

export function getPaymentClients(request: Request) {
  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!token || !supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Authentication or Supabase configuration is missing.')
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return { userClient, adminClient }
}

export async function getPaystackSecret() {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.')
  return secret
}

export function constantTimeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length)
  let difference = left.length ^ right.length
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }
  return difference === 0
}

export async function markPaymentAndOrdersPaid(
  adminClient: ReturnType<typeof createClient>,
  payment: { id: string; reference: string; cart_group_id: string; status: string },
  paidAt = new Date().toISOString(),
) {
  if (payment.status !== 'paid') {
    const { error: paymentError } = await adminClient
      .from('payments')
      .update({ status: 'paid', paid_at: paidAt })
      .eq('id', payment.id)
    if (paymentError) throw paymentError
  }

  const { error: orderError } = await adminClient
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('cart_group_id', payment.cart_group_id)
    .eq('payment_status', 'unpaid')
  if (orderError) throw orderError
}