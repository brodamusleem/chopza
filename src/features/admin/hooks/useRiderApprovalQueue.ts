import { getPendingRiders } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'

export function useRiderApprovalQueue() {
  return useAdminQuery(getPendingRiders)
}
