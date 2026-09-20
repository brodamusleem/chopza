import { z } from 'zod'
export const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name.'),
  email: z.email(),
  password: z.string().min(8, 'Use at least 8 characters.'),
  confirm_password: z.string(),
}).refine((values) => values.password === values.confirm_password, {
  path: ['confirm_password'],
  message: 'Passwords do not match.',
})
export type RegisterValues = z.infer<typeof registerSchema>
