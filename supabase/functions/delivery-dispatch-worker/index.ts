import { createClient } from 'npm:@supabase/supabase-js@2'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) throw new Error('Supabase service role is not configured.')
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const vendorTimeouts = await admin.rpc('process_dispatch_timeouts')
    if (vendorTimeouts.error) throw vendorTimeouts.error
    const riderTimeouts = await admin.rpc('process_expired_rider_assignments')
    if (riderTimeouts.error) throw riderTimeouts.error
    const assignments = await admin.rpc('dispatch_unassigned_ready_orders')
    if (assignments.error) throw assignments.error

    return json({
      ok: true,
      vendorTimeoutAlerts: vendorTimeouts.data ?? 0,
      expiredRiderOffers: riderTimeouts.data ?? 0,
      newRiderOffers: assignments.data ?? 0,
    })
  } catch (cause) {
    return json({ error: cause instanceof Error ? cause.message : 'Dispatch worker failed.' }, 500)
  }
})
