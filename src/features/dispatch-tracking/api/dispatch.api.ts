import { requireSupabase } from '@/shared/lib/supabaseClient'
export async function getDispatchOrder(orderId: string) {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()
  if (error) throw error
  return data
}
