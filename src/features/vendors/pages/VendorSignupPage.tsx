import { Link } from 'react-router'
import { SignupForm } from '@/features/auth'
import { AuthPageShell } from '@/features/auth/components/AuthPageShell'

export function Component() {
  return (
    <AuthPageShell
      title="Sell on Chopza"
      subtitle="Create a partner account and bring your restaurant to more customers."
      initialRole="vendor"
    >
      <SignupForm role="vendor" redirectTo="/vendor/onboarding" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
