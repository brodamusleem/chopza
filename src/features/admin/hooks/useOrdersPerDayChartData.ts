import { getOrdersPerDay } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'
export function useOrdersPerDayChartData() {
  return useAdminQuery(getOrdersPerDay)
}
