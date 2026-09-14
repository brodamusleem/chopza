import { Badge } from '@/shared/components/ui/badge'
const colors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-rose-100 text-rose-900',
  suspended: 'bg-red-100 text-red-900',
  accepted: 'bg-blue-100 text-blue-900',
  preparing: 'bg-orange-100 text-orange-900',
  rider_assigned: 'bg-cyan-100 text-cyan-900',
  picked_up: 'bg-indigo-100 text-indigo-900',
  in_transit: 'bg-violet-100 text-violet-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-red-100 text-red-900',
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={colors[status]}>
      {status.replaceAll('_', ' ')}
    </Badge>
  )
}
