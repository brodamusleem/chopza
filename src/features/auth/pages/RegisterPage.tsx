import { RegisterForm } from '../components/RegisterForm'
export function Component() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-card p-7">
      <h1 className="mb-2 text-3xl font-semibold">Join the table</h1>
      <p className="mb-7 text-muted-foreground">Create your Chopza account.</p>
      <RegisterForm />
    </section>
  )
}
