import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { RefreshCw } from 'lucide-react'
import type { VendorApplication } from '../../api/vendorOnboarding.api'

export function PendingReviewPage({ application, onRefresh, isRefreshing }: { application: VendorApplication; onRefresh: () => void; isRefreshing: boolean }) {
  return <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Application under review</CardTitle></CardHeader><CardContent><p>Thanks for applying to sell on Chopza. <strong>{application.name}</strong> is now with our admin team for review.</p><p className="mt-3 text-muted-foreground">You cannot edit the application while it is being reviewed.</p><Button variant="outline" className="mt-6" onClick={onRefresh} disabled={isRefreshing}><RefreshCw className={isRefreshing ? 'animate-spin' : ''} /> Check application status</Button></CardContent></Card>
}
