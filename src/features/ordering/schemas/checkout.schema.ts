import { z } from 'zod'
export const checkoutSchema = z.object({
  address: z.string().trim().min(10, 'Enter a complete delivery address.'),
  phone: z
    .string()
    .regex(/^(?:\+234|0)[789]\d{9}$/, 'Enter a Nigerian mobile number.'),
  notes: z.string().max(500).optional(),
})
export type CheckoutValues = z.infer<typeof checkoutSchema>
