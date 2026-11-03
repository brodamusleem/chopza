import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { AuthNotice } from './AuthNotice'
import { loginSchema, type LoginValues } from '../schemas/login.schema'
import { getProfileRole, login } from '../api/auth.api'
import { useAuthStore } from '../store/authStore'
export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  async function submit(values: LoginValues) {
    try {
      const { session } = await login(values)
      useAuthStore.getState().setSession(session)
      const profileRole = session?.user
        ? await getProfileRole(session.user.id)
        : null
      useAuthStore.getState().setProfileRole(profileRole)
      const state: unknown = location.state
      const stateRole =
        state && typeof state === 'object' && 'role' in state
          ? state.role
          : null
      const intendedRole =
        stateRole ?? sessionStorage.getItem('chopza-pending-signup-role')
      const from =
        state && typeof state === 'object' && 'from' in state
          ? state.from
          : null
      if (intendedRole === 'vendor' && profileRole !== 'vendor') {
        setError('root', {
          message:
            'This account is not configured as a vendor yet. Apply the latest Supabase migrations, then use a new vendor signup or update this account profile role.',
        })
        return
      }
      if (intendedRole === profileRole) {
        sessionStorage.removeItem('chopza-pending-signup-role')
      }
      navigate(
        typeof from === 'string' &&
          from.startsWith('/') &&
          !from.startsWith('//')
          ? from
          : profileRole === 'admin'
            ? '/admin/dashboard'
            : profileRole === 'vendor'
              ? '/vendor/dashboard'
              : profileRole === 'rider'
                ? '/rider/dashboard'
                : '/',
        { replace: true },
      )
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Unable to sign in.',
      })
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-12 rounded-xl bg-background px-4"
          {...register('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className="h-12 rounded-xl bg-background px-4"
          {...register('password')}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>
      {errors.root && (
        <AuthNotice variant="error">{errors.root.message}</AuthNotice>
      )}
      <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/15" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="pt-1 text-center text-sm text-muted-foreground">
        New to Chopza?{' '}
        <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/register">
          Create an account
        </Link>
      </p>
    </form>
  )
}
