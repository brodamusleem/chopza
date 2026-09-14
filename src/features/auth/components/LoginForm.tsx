import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
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
      const from =
        state && typeof state === 'object' && 'from' in state
          ? state.from
          : null
      navigate(
        typeof from === 'string' &&
          from.startsWith('/') &&
          !from.startsWith('//')
          ? from
          : profileRole === 'admin'
            ? '/admin/dashboard'
            : '/vendors',
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
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-sm">
        New to Chopza?{' '}
        <Link className="underline" to="/register">
          Create an account
        </Link>
      </p>
    </form>
  )
}
