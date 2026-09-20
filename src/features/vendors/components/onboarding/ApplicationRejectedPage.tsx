import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { VendorApplication } from '../../api/vendorOnboarding.api'
import { VendorApplicationForm } from './VendorApplicationForm'

export function ApplicationRejectedPage({ application, onComplete }: { application: VendorApplication; onComplete: () => void }) {
  return <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Application needs changes</CardTitle><p className="text-sm text-muted-foreground">Your application for {application.name} was not approved. Update the details below and resubmit it for review. Admin rejection reasons are not available yet.</p></CardHeader><CardContent><VendorApplicationForm existingVendor={application} onComplete={onComplete} /></CardContent></Card>
}
