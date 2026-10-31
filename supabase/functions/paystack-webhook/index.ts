import { createClient } from 'npm:@supabase/supabase-js@2'
import { constantTimeEqual, markPaymentAndOrdersPaid } from '../_shared/payments.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-paystack-signature',
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

async function hmacSha512(secret: string, body: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return Array.from(new Uint8Array(signature))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
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
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.')

    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    if (!signature) return jsonResponse({ error: 'Missing Paystack signature.' }, 401)

    const expected = await hmacSha512(secret, rawBody)
    if (!constantTimeEqual(signature, expected)) {
      return jsonResponse({ error: 'Invalid Paystack signature.' }, 401)
    }

    const event = JSON.parse(rawBody)
    if (!event || event.event !== 'charge.success') return jsonResponse({ ok: true }, 200)

    const paymentReference = typeof event.data?.reference === 'string' ? event.data.reference : null
    const paymentAmount = Number(event.data?.amount ?? 0)
    const paymentCurrency = typeof event.data?.currency === 'string' ? event.data.currency : 'NGN'
    if (!paymentReference) return jsonResponse({ ok: true }, 200)

    const adminClient = await getAdminClient()
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, cart_group_id, amount, currency, status, reference')
      .eq('reference', paymentReference)
      .maybeSingle()

    if (paymentError) throw paymentError
    if (!payment) return jsonResponse({ ok: true }, 200)
    if (payment.status === 'paid') return jsonResponse({ ok: true }, 200)

    const expectedAmountKobo = Math.round(Number(payment.amount) * 100)
    if (paymentAmount !== expectedAmountKobo || paymentCurrency !== payment.currency) {
      return jsonResponse({ ok: false, reason: 'amount mismatch' }, 200)
    }

    await markPaymentAndOrdersPaid(adminClient, payment)

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to process Paystack webhook.' }, 400)
  }
})
