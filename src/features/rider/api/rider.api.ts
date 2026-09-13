export async function acceptDelivery(_orderId: string): Promise<never> {
  throw new Error(
    'Delivery assignment requires a server-authorized workflow. It is not connected yet.',
  )
}
