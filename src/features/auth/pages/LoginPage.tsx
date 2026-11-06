import { Navigate, useLocation } from 'react-router'
import type { Role } from '@/shared/constants/roles'
import { useAuthStore } from '../store/authStore'
import { roleHome } from '../roleRedirect'
import { AuthNotice } from '../components/AuthNotice'
import { AuthPageShell } from '../components/AuthPageShell'
import { LoginForm } from '../components/LoginForm'

type LoginLocationState = { message?: string; role?: Role } | null

export function Component() {
  const location = useLocation()
  const { ready, session, role } = useAuthStore()
  const state = location.state as LoginLocationState

  if (!ready) return <p className="py-16 text-center text-sm text-muted-foreground">Checking your account…</p>
  if (session && role) return <Navigate to={roleHome(role)} replace />

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in and pick up right where you left off."
      initialRole={state?.role ?? 'customer'}
    >
      {state?.message && (
        <div className="mb-5">
          <AuthNotice variant="success">
            <p className="font-semibold">You’re almost in</p>
            <p className="mt-0.5 opacity-90">{state.message}</p>
          </AuthNotice>
        </div>
      )}
      <LoginForm />
    </AuthPageShell>
  )
}
