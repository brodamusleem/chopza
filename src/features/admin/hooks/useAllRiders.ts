import { getAllRiders } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'

export function useAllRiders() {
  return useAdminQuery(getAllRiders)
}
