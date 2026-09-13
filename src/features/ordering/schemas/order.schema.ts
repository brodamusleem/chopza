import { z } from 'zod'
export const orderStatusSchema = z.enum([
  'pending',
  'accepted',
  'preparing',
  'picked_up',
  'delivered',
  'cancelled',
])
export type OrderStatus = z.infer<typeof orderStatusSchema>
export const orderSchema = z.object({
  id: z.uuid(),
  customer_id: z.uuid(),
  rider_id: z.uuid().nullable(),
  status: orderStatusSchema,
  updated_at: z.iso.datetime({ offset: true }),
})
