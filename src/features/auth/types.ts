import type { Session, User } from '@supabase/supabase-js'
import type { Role } from '@/shared/constants/roles'
export type AuthState = {
  user: User | null
  session: Session | null
  role: Role | null
  ready: boolean
  error: string | null
}
