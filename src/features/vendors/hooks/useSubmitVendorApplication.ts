import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { createVendorApplication } from '../api/vendorOnboarding.api'
import type { VendorApplicationValues } from '../schemas/vendorApplication.schema'

export function useSubmitVendorApplication() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  return {
    isSubmitting,
    submit: async (values: VendorApplicationValues, logo?: File) => {
      if (!user) throw new Error('You must be signed in to apply.')
      setIsSubmitting(true)
      try {
        return await createVendorApplication(user.id, values, logo)
      } finally {
        setIsSubmitting(false)
      }
    },
  }
}
