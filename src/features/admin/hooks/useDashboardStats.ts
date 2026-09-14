import { getDashboardStats } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'
export function useDashboardStats() {
  return useAdminQuery(getDashboardStats)
}
