import { Construction } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
export function VendorComingSoonPage({ title, children }: { title: string; children: string }) { return <Card className="max-w-2xl"><CardHeader><Construction className="mb-2 size-8 text-primary" /><CardTitle>{title} — Coming soon</CardTitle></CardHeader><CardContent className="text-muted-foreground">{children}</CardContent></Card> }
