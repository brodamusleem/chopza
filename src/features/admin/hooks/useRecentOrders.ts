import { useCallback } from 'react'
import { getRecentOrders } from '../api/admin.api'
import type { OrderFilters } from '../types'
import { useAdminQuery } from './useAdminQuery'
export function useRecentOrders({ status, from, to }: OrderFilters) {
  const query = useCallback(
    () => getRecentOrders({ status, from, to }),
    [status, from, to],
  )
  return useAdminQuery(query)
}
