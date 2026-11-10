import { VendorApplicationForm } from '../components/onboarding/VendorApplicationForm'
import { useVendorApplicationStatus } from '../hooks/useVendorApplicationStatus'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Switch } from '@/shared/components/ui/switch'
import { toast } from 'sonner'
import { updateVendorOpenStatus } from '../api/vendorOnboarding.api'
import { useNavigate } from 'react-router'
export function Component() {
  const navigate = useNavigate()
  const { application, refetch } = useVendorApplicationStatus()
  const updateOpenStatus = async (isOpen: boolean) => {
    if (!application) return
    try {
      await updateVendorOpenStatus(application.id, isOpen)
      await refetch()
      toast.success(
        isOpen ? 'Your business is now open.' : 'Your business is now closed.',
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to update business availability.',
      )
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Profile & settings</h1>
        <p className="text-muted-foreground">
          Update the information customers see.
        </p>
      </div>
      {application && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div>
              <p className="font-medium">Accepting orders</p>
              <p className="text-sm text-muted-foreground">
                Turn this off to show customers that your business is closed.
              </p>
            </div>
            <Switch
              checked={application.is_open}
              onCheckedChange={(isOpen) => void updateOpenStatus(isOpen)}
              aria-label="Accepting orders"
            />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
        </CardHeader>
        <CardContent>
          {application && (
            <VendorApplicationForm
              existingVendor={application}
              onComplete={() => {
                void refetch()
                toast.success('Changes submitted for admin review.')
                navigate('/vendor/pending-review', { replace: true })
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
