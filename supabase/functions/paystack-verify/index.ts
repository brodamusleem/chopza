import { createClient } from 'npm:@supabase/supabase-js@2'
import { markPaymentAndOrdersPaid } from '../_shared/payments.ts'

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
    const reference = typeof body.reference === 'string' ? body.reference : ''
    if (!reference) return jsonResponse({ error: 'Reference is required.' }, 400)

    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, cart_group_id, customer_id, amount, currency, status, reference')
      .eq('reference', reference)
      .eq('customer_id', userData.user.id)
      .maybeSingle()

    if (paymentError) throw paymentError
    if (!payment) return jsonResponse({ error: 'Payment not found.' }, 404)

    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecret) throw new Error('PAYSTACK_SECRET_KEY is not configured.')

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    })
    const paystackResult = await paystackResponse.json()
    if (!paystackResponse.ok || !paystackResult.status) {
      return jsonResponse({ verified: false, status: paystackResult.message || 'Verification failed.' }, 400)
    }

    const transaction = paystackResult.data
    const expectedAmountKobo = Math.round(Number(payment.amount) * 100)
    const success = transaction.status === 'success'
      && transaction.reference === reference
      && transaction.amount === expectedAmountKobo
      && transaction.currency === payment.currency

    if (!success) {
      if (transaction.status === 'failed' || transaction.status === 'abandoned') {
        const { error: updateError } = await adminClient
          .from('payments')
          .update({ status: 'failed' })
          .eq('reference', reference)
          .neq('status', 'paid')
        if (updateError) throw updateError
        return jsonResponse({ verified: false, status: transaction.status }, 200)
      }
      return jsonResponse({ verified: false, status: transaction.status || 'pending' }, 200)
    }

    await markPaymentAndOrdersPaid(adminClient, payment, transaction.paid_at || new Date().toISOString())

    return jsonResponse({ verified: true, cart_group_id: payment.cart_group_id, status: 'paid' }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to verify payment.' }, 400)
  }
})
