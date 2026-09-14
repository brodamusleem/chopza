import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card'
export function QueryError({
  error,
  retry,
}: {
  error: Error
  retry: () => void
}) {
  return (
    <Card role="alert">
      <CardHeader>
        <CardTitle>Could not load data</CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
