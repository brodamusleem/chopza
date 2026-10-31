import { useCallback } from 'react'
import { getRiderById } from '../api/admin.api'
import { useAdminQuery } from './useAdminQuery'

export function useRiderDetail(riderId: string) {
  return useAdminQuery(useCallback(() => getRiderById(riderId), [riderId]))
}
