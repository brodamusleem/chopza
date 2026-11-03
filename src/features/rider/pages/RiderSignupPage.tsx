import { Link } from 'react-router'
import { SignupForm } from '@/features/auth'
import { AuthPageShell } from '@/features/auth/components/AuthPageShell'

export function Component() {
  return (
    <AuthPageShell
      title="Ride with Chopza"
      subtitle="Create a rider account and start your delivery journey in Kano."
      initialRole="rider"
    >
      <SignupForm role="rider" redirectTo="/rider/dashboard" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
