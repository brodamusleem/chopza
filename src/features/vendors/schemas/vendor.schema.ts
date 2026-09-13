import { z } from 'zod'
export const vendorSchema = z.object({
  name: z.string().trim().min(2),
  cuisine: z.string().min(2),
  area: z.string().min(2),
  deliveryMinutes: z.number().int().positive(),
})
