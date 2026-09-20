import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { resubmitVendorApplication, updateVendorApplication } from '../api/vendorOnboarding.api'
import type { VendorApplication } from '../api/vendorOnboarding.api'
import type { VendorApplicationValues } from '../schemas/vendorApplication.schema'

export function useResubmitVendorApplication() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  return {
    isSubmitting,
    submit: async (vendor: VendorApplication, values: VendorApplicationValues, logo?: File) => {
      if (!user) throw new Error('You must be signed in to resubmit.')
      setIsSubmitting(true)
      try {
        await updateVendorApplication(vendor.id, user.id, values, logo)
        await resubmitVendorApplication(vendor.id)
      } finally {
        setIsSubmitting(false)
      }
    },
  }
}
