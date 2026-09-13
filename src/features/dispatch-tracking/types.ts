import { z } from 'zod'
export const riderLocationSchema = z.object({
  riderId: z.uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
  timestamp: z.number().int().positive(),
})
export type RiderLocation = z.infer<typeof riderLocationSchema>
export type ChannelState = 'idle' | 'connecting' | 'subscribed' | 'error'
export const riderTopic = (riderId: string) => `rider:${riderId}:location`
