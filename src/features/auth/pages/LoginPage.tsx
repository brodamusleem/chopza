import { LoginForm } from '../components/LoginForm'
export function Component() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-card p-7">
      <h1 className="mb-2 text-3xl font-semibold">Welcome back</h1>
      <p className="mb-7 text-muted-foreground">
        Sign in to your Chopza account.
      </p>
      <LoginForm />
    </section>
  )
}
