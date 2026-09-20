import { Navigate, useLocation, useNavigate } from 'react-router'
import { useVendorApplicationStatus } from '../hooks/useVendorApplicationStatus'
import { PendingReviewPage } from '../components/onboarding/PendingReviewPage'
import { ApplicationRejectedPage } from '../components/onboarding/ApplicationRejectedPage'
import { SuspendedPage } from '../components/onboarding/SuspendedPage'

export function Component() {
  const { application, status, isLoading, error, refetch } = useVendorApplicationStatus()
  const location = useLocation()
  const navigate = useNavigate()
  if (isLoading) return <p role="status">Loading your application…</p>
  if (error) return <p role="alert">{error.message}</p>
  if (!application) return <Navigate to="/vendor/onboarding" replace />
  if (status === 'approved') return <Navigate to="/vendor/dashboard" replace />
  if (status === 'pending' && location.pathname !== '/vendor/pending-review') return <Navigate to="/vendor/pending-review" replace />
  if (status === 'rejected' && location.pathname !== '/vendor/application-rejected') return <Navigate to="/vendor/application-rejected" replace />
  if (status === 'suspended') return <SuspendedPage />
  if (status === 'pending') return <PendingReviewPage application={application} onRefresh={refetch} isRefreshing={isLoading} />
  if (status === 'rejected') return <ApplicationRejectedPage application={application} onComplete={() => navigate('/vendor/pending-review', { replace: true })} />
  return null
}
