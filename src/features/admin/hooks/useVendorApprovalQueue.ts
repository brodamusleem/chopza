import { getPendingVendors } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'
export function useVendorApprovalQueue() {
  return useAdminQuery(getPendingVendors)
}
