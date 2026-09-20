import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export function ComingSoonPage({ title }: { title: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">This admin section is coming soon.</p></CardContent></Card>
}