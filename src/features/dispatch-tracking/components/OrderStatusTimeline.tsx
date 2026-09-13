import type { OrderStatus } from '@/features/ordering'
const steps = [
  'pending',
  'accepted',
  'preparing',
  'picked_up',
  'delivered',
] as const
const labels = {
  pending: 'Order placed',
  accepted: 'Restaurant accepted',
  preparing: 'Preparing your food',
  picked_up: 'On the way',
  delivered: 'Delivered',
}
export function OrderStatusTimeline({
  status,
}: {
  status: OrderStatus | null
}) {
  if (!status)
    return (
      <p className="text-muted-foreground">
        Order status will appear when tracking is connected.
      </p>
    )
  if (status === 'cancelled')
    return <p role="status">This order was cancelled.</p>
  const current = steps.indexOf(status)
  return (
    <ol className="space-y-5">
      {steps.map((step, index) => (
        <li
          className={`flex items-center gap-3 ${index <= current ? 'text-primary' : 'text-muted-foreground'}`}
          key={step}
          aria-current={status === step ? 'step' : undefined}
        >
          <span
            className={`flex size-8 items-center justify-center rounded-full border text-sm ${index <= current ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {index + 1}
          </span>
          <span>
            {labels[step]}
            {status === step && <span className="sr-only"> (current)</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
