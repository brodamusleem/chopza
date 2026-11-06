import { useLocation } from 'react-router'
import type { Role } from '@/shared/constants/roles'
import { AuthNotice } from '../components/AuthNotice'
import { AuthPageShell } from '../components/AuthPageShell'
import { LoginForm } from '../components/LoginForm'

type LoginLocationState = { message?: string; role?: Role } | null

export function Component() {
  const location = useLocation()
  const state = location.state as LoginLocationState

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
