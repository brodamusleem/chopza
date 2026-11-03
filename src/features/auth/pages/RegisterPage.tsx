import { Link } from 'react-router'
import { AuthPageShell } from '../components/AuthPageShell'
import { SignupForm } from '../components/SignupForm'

export function Component() {
  return (
    <AuthPageShell
      title="Join the table"
      subtitle="Create your Chopza account and find your next favourite meal."
    >
      <SignupForm role="customer" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
