import { z } from 'zod'
export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(8, 'Use at least 8 characters.'),
})
export type RegisterValues = z.infer<typeof registerSchema>
