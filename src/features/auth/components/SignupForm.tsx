import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Role } from '@/shared/constants/roles'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { AuthNotice } from './AuthNotice'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { register as signUp } from '../api/auth.api'
import { registerSchema, type RegisterValues } from '../schemas/register.schema'

export function SignupForm({
  role,
  redirectTo,
}: {
  role: Role
  redirectTo?: string
}) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  })
  return (
    <Form {...form}>
      <form
        className="space-y-4 sm:space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          setMessage('')
          try {
            const data = await signUp({ ...values, role })
            if (redirectTo && data.session) {
              navigate(redirectTo, { replace: true })
              return
            }
            if (!data.session) {
              sessionStorage.setItem('chopza-pending-signup-role', role)
              navigate('/login', {
                replace: true,
                state: {
                  message: `Account created. Check ${values.email} to confirm your email, then sign in.`,
                  role,
                },
              })
              return
            }
            setMessage('Account created. You are signed in.')
          } catch (cause: unknown) {
            form.setError('root', {
              message:
                cause instanceof Error
                  ? cause.message
                  : 'Unable to create account.',
            })
          }
        })}
      >
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Your name" className="h-12 rounded-xl bg-background px-4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" className="h-12 rounded-xl bg-background px-4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" placeholder="Create a password" className="h-12 rounded-xl bg-background px-4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" placeholder="Enter it again" className="h-12 rounded-xl bg-background px-4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <AuthNotice variant="error">{form.formState.errors.root.message}</AuthNotice>
        )}
        {message && <AuthNotice variant="success">{message}</AuthNotice>}
        <Button
          className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/15"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting
            ? 'Creating account…'
            : role === 'vendor'
              ? 'Create vendor account'
              : 'Create account'}
        </Button>
      </form>
    </Form>
  )
}
