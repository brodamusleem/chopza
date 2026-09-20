import { useLocation } from 'react-router'
import { LoginForm } from '../components/LoginForm'
export function Component() {
  const location = useLocation()
  const state = location.state as { message?: string } | null
  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-card p-7">
      <h1 className="mb-2 text-3xl font-semibold">Welcome back</h1>
      <p className="mb-7 text-muted-foreground">
        Sign in to your Chopza account.
      </p>
      {state?.message && <p role="status" className="mb-5 text-sm text-primary">{state.message}</p>}
      <LoginForm />
    </section>
  )
}
