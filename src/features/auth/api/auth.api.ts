import { requireSupabase } from '@/shared/lib/supabaseClient'
import type { Role } from '@/shared/constants/roles'
import type { LoginValues } from '../schemas/login.schema'
import type { RegisterValues } from '../schemas/register.schema'
export async function login(values: LoginValues) {
  const { data, error } =
    await requireSupabase().auth.signInWithPassword(values)
  if (error) throw error
  return data
}
export async function register({ name, email, password }: RegisterValues) {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw error
  return data
}
export async function logout() {
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw error
}

export async function getProfileRole(userId: string): Promise<Role | null> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.role ?? null
}
