import { getDashboardAnalytics } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'

export function useDashboardAnalytics() {
  return useAdminQuery(getDashboardAnalytics)
}
