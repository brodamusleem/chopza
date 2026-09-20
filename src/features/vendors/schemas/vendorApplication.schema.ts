import { z } from 'zod'

export const vendorApplicationSchema = z.object({
  name: z.string().trim().min(2, 'Enter your business name.'),
  description: z.string().trim().max(1000, 'Keep the description under 1000 characters.'),
  address: z.string().trim().min(5, 'Enter the business address.'),
  service_area_id: z.string().min(1, 'Choose a service area.'),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

export type VendorApplicationValues = z.infer<typeof vendorApplicationSchema>
