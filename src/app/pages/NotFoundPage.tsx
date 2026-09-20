import { Link } from 'react-router'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export function NotFoundPage() {
  const { role } = useAuth()
  const destination = role === 'admin' ? '/admin/dashboard' : role === 'vendor' ? '/vendor/dashboard' : role === 'rider' ? '/rider/dashboard' : '/'
  return <main className="mx-auto max-w-xl px-5 py-16"><Card><CardHeader><CardTitle>Page not found</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">That Chopza page does not exist.</p><Button asChild><Link to={destination}>{destination === '/' ? 'Back to Chopza' : 'Back to dashboard'}</Link></Button></CardContent></Card></main>
}
