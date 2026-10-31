import { CheckoutForm } from '../components/CheckoutForm'
import { Badge } from '@/shared/components/ui/badge'
export function Component() {
  const isTestMode = import.meta.env.VITE_PAYMENT_MODE === 'test'
  return (
    <div className="space-y-7">
      <h1 className="text-3xl font-semibold">Delivery details</h1>
      {isTestMode && (
        <Badge variant="secondary">Test mode: no real money will be charged</Badge>
      )}
      <CheckoutForm />
    </div>
  )
}
