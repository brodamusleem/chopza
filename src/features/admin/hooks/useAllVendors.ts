import { getAllVendors } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'
export function useAllVendors() {
  return useAdminQuery(getAllVendors)
}
