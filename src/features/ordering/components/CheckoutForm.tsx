import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { checkoutSchema, type CheckoutValues } from '../schemas/checkout.schema'
import { useCreateOrder } from '../hooks/useCreateOrder'
import { useCart } from '../hooks/useCart'
import { useState } from 'react'
import { LocationPicker } from '@/features/vendors/components/onboarding/LocationPicker'

export function CheckoutForm() {
  const { submit, retryPayment, paymentGroupId, pending, error } = useCreateOrder()
  const { items } = useCart()
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      latitude: null,
      longitude: null,
    },
  })

  return (
    <form
      className="max-w-xl space-y-5"
      onSubmit={handleSubmit((values) =>
        submit({ ...values, latitude, longitude }),
      )}
      noValidate
    >
      <p className="text-muted-foreground">
        Complete your delivery details and place your order. Payment is still
        awaiting server confirmation in this phase.
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

      <LocationPicker
        latitude={latitude}
        longitude={longitude}
        onChange={(nextLatitude, nextLongitude) => {
          setLatitude(nextLatitude)
          setLongitude(nextLongitude)
        }}
      />

      {error && <p role="alert">{error}</p>}
      {paymentGroupId && (
        <Button type="button" variant="outline" disabled={pending} onClick={() => void retryPayment()}>
          {pending ? 'Starting payment…' : 'Retry payment'}
        </Button>
      )}
      <Button disabled={pending || !items.length} type="submit">
        {pending ? 'Placing order…' : 'Place order and pay'}
      </Button>
      {!items.length && <p>Add items to your cart first.</p>}
    </form>
  )
}
