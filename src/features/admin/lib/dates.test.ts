import { describe, expect, it } from 'vitest'
import { countOrdersPerDay, dayKey, nextDay, startOfLagosDay } from './dates'
describe('Kano dashboard day boundaries', () => {
  it('uses Lagos midnight rather than browser or UTC midnight', () => {
    expect(dayKey(new Date('2026-09-13T23:30:00Z'))).toBe('2026-09-14')
    expect(startOfLagosDay('2026-09-14')).toBe('2026-09-13T23:00:00.000Z')
    expect(nextDay('2026-12-31')).toBe('2027-01-01')
  })
  it('zero-fills seven days and bins boundary orders correctly', () => {
    const days = countOrdersPerDay(
      [
        { created_at: '2026-09-12T22:59:00Z' },
        { created_at: '2026-09-12T23:00:00Z' },
        { created_at: '2026-08-01T00:00:00Z' },
      ],
      new Date('2026-09-13T12:00:00Z'),
    )
    expect(days).toHaveLength(7)
    expect(days.at(-1)).toMatchObject({ date: '2026-09-13', orders: 1 })
    expect(days.at(-2)?.orders).toBe(1)
    expect(days[0].orders).toBe(0)
  })
})
