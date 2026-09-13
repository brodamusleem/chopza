import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { registerSchema, type RegisterValues } from '../schemas/register.schema'
import { register as signUp } from '../api/auth.api'
export function RegisterForm() {
  const [message, setMessage] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        setMessage('')
        try {
          const data = await signUp(values)
          setMessage(
            data.session
              ? 'Account created. You are signed in.'
              : 'Check your email to confirm your account.',
          )
        } catch (error) {
          setError('root', {
            message:
              error instanceof Error
                ? error.message
                : 'Unable to create account.',
          })
        }
      })}
    >
      {(['name', 'email', 'password'] as const).map((field) => (
        <div className="space-y-2" key={field}>
          <Label htmlFor={`register-${field}`} className="capitalize">
            {field}
          </Label>
          <Input
            id={`register-${field}`}
            type={
              field === 'password'
                ? 'password'
                : field === 'email'
                  ? 'email'
                  : 'text'
            }
            autoComplete={field === 'password' ? 'new-password' : field}
            {...register(field)}
            aria-invalid={!!errors[field]}
            aria-describedby={errors[field] ? `${field}-error` : undefined}
          />
          {errors[field] && (
            <p id={`${field}-error`} className="text-sm text-destructive">
              {errors[field]?.message}
            </p>
          )}
        </div>
      ))}
      {errors.root && <p role="alert">{errors.root.message}</p>}
      {message && <p role="status">{message}</p>}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
      <Link className="block text-sm underline" to="/login">
        Already have an account? Sign in
      </Link>
    </form>
  )
}
