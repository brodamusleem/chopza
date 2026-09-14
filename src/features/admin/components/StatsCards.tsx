import { Store, Clock3, ShoppingBag, Bike } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { DashboardStats, QueryResult } from '../types'
import { QueryError } from './QueryError'
export function StatsCards({
  data,
  isLoading,
  error,
  refetch,
}: QueryResult<DashboardStats>) {
  if (error) return <QueryError error={error} retry={() => void refetch()} />
  const cards = [
    {
      key: 'totalVendors',
      title: 'Total vendors',
      description: 'Across all statuses',
      icon: Store,
    },
    {
      key: 'pendingVendors',
      title: 'Pending approvals',
      description: 'Waiting for your review',
      icon: Clock3,
    },
    {
      key: 'ordersToday',
      title: 'Orders today',
      description: 'Since midnight in Kano',
      icon: ShoppingBag,
    },
    {
      key: 'inTransit',
      title: 'On the move',
      description: 'Assigned, picked up or in transit',
      icon: Bike,
    },
  ] as const
  return (
    <section
      aria-label="Dashboard statistics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy={isLoading}
    >
      {cards.map(({ key, title, description, icon: Icon }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              {title}
              <Icon
                size={18}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <span className="text-3xl font-semibold tabular-nums">
                {data[key].toLocaleString()}
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
