import { useNavigate } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { VendorApplicationForm } from '../components/onboarding/VendorApplicationForm'
export function Component() { const navigate = useNavigate(); return <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Tell us about your business</CardTitle><p className="text-sm text-muted-foreground">Submit your restaurant details. An admin will review them before you can start selling.</p></CardHeader><CardContent><VendorApplicationForm onComplete={() => navigate('/vendor/pending-review', { replace: true })} /></CardContent></Card> }
