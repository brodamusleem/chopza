import { describe, expect, it } from 'vitest'
import { riderLocationSchema } from './types'
describe('location broadcast validation', () => {
  const location = {
    riderId: '11111111-1111-4111-8111-111111111111',
    lat: 12.0022,
    lng: 8.592,
    accuracy: 5,
    timestamp: 1800000000000,
  }
  it('accepts a valid Kano position', () =>
    expect(riderLocationSchema.safeParse(location).success).toBe(true))
  it('rejects malformed coordinates and identities', () => {
    expect(
      riderLocationSchema.safeParse({ ...location, lat: 91 }).success,
    ).toBe(false)
    expect(
      riderLocationSchema.safeParse({ ...location, riderId: 'not-a-user' })
        .success,
    ).toBe(false)
    expect(
      riderLocationSchema.safeParse({ ...location, lng: '8.592' }).success,
    ).toBe(false)
  })
})
