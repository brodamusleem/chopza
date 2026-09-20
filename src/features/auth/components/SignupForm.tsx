import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Role } from '@/shared/constants/roles'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { register as signUp } from '../api/auth.api'
import { registerSchema, type RegisterValues } from '../schemas/register.schema'

export function SignupForm({ role, redirectTo }: { role: Role; redirectTo?: string }) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  })
  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(async (values) => {
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
          form.setError('root', { message: cause instanceof Error ? cause.message : 'Unable to create account.' })
        }
      })}>
        <FormField control={form.control} name="full_name" render={({ field }) => <FormItem><FormLabel>Your full name</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="password" render={({ field }) => <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="confirm_password" render={({ field }) => <FormItem><FormLabel>Confirm password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>} />
        {form.formState.errors.root && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
        {message && <p role="status">{message}</p>}
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? 'Creating account…' : role === 'vendor' ? 'Create vendor account' : 'Create account'}</Button>
      </form>
    </Form>
  )
}
