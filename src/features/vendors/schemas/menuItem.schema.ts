import { z } from 'zod'
export const menuItemSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().max(500),
  priceKobo: z.number().int().nonnegative(),
  available: z.boolean(),
})
