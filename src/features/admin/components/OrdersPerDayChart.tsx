import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/shared/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/shared/components/ui/chart'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { OrdersPerDay, QueryResult } from '../types'
import { QueryError } from './QueryError'
const config = {
  orders: { label: 'Orders', color: 'var(--primary)' },
} satisfies ChartConfig
export function OrdersPerDayChart({
  data,
  isLoading,
  error,
  refetch,
}: QueryResult<OrdersPerDay>) {
  if (error) return <QueryError error={error} retry={() => void refetch()} />
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders over the last 7 days</CardTitle>
        <CardDescription>
          Daily order volume · Africa/Lagos · Includes today
        </CardDescription>
      </CardHeader>
      <CardContent aria-busy={isLoading}>
        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="orders"
                fill="var(--color-orders)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
