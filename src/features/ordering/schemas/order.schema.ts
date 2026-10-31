import { z } from 'zod'
export const orderStatusSchema = z.enum([
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'rider_assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
])
export type OrderStatus = z.infer<typeof orderStatusSchema>
export const orderSchema = z.object({
  id: z.uuid(),
  customer_id: z.uuid(),
  rider_id: z.uuid().nullable(),
  cart_group_id: z.uuid().optional(),
  status: orderStatusSchema,
  payment_status: z.enum([
    'unpaid',
    'paid',
    'failed',
    'refund_pending',
    'refunded',
  ]).optional(),
  total_amount: z.number().optional(),
  subtotal: z.number().optional(),
  delivery_fee: z.number().optional(),
  service_fee: z.number().optional(),
  delivery_address: z.string().optional(),
  delivery_latitude: z.number().nullable().optional(),
  delivery_longitude: z.number().nullable().optional(),
  updated_at: z.iso.datetime({ offset: true }),
  current_lat: z.number().nullable().optional(),
  current_lng: z.number().nullable().optional(),
  location_updated_at: z.iso.datetime({ offset: true }).nullable().optional(),
})
