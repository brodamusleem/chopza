import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
export function RouteError() {
  const error = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <Card role="alert"><CardHeader><CardTitle>{isNotFound ? 'Page not found' : 'Something went wrong'}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">{isNotFound ? 'That Chopza page does not exist.' : 'The page could not be displayed.'}</p><div className="flex gap-3"><Button onClick={() => window.location.reload()}>Reload page</Button><Button variant="outline" asChild><Link to="/">Back to Chopza</Link></Button></div></CardContent></Card>
    </main>
  )
}
