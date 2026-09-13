import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { checkoutSchema, type CheckoutValues } from '../schemas/checkout.schema'
import { useCreateOrder } from '../hooks/useCreateOrder'
import { useCart } from '../hooks/useCart'
export function CheckoutForm() {
  const { submit, pending, error } = useCreateOrder()
  const { items } = useCart()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema) })
  return (
    <form
      className="max-w-xl space-y-5"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <p className="text-muted-foreground">
        Preview your delivery details. Order placement is not connected yet.
      </p>
      {(['address', 'phone', 'notes'] as const).map((field) => (
        <div className="space-y-2" key={field}>
          <Label className="capitalize" htmlFor={field}>
            {field}
          </Label>
          <Input
            id={field}
            type={field === 'phone' ? 'tel' : 'text'}
            autoComplete={
              field === 'address'
                ? 'street-address'
                : field === 'phone'
                  ? 'tel'
                  : 'off'
            }
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
      {error && <p role="alert">{error}</p>}
      <Button disabled={pending || !items.length} type="submit">
        {pending ? 'Checking…' : 'Validate checkout preview'}
      </Button>
      {!items.length && <p>Add items to your cart first.</p>}
    </form>
  )
}
