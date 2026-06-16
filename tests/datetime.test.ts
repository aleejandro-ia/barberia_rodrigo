import { describe, it, expect } from 'vitest'
import { madridTimeToMs, hoursUntilMadrid } from '@/lib/datetime'

describe('madridTimeToMs', () => {
  it('treats winter wall-clock as CET (UTC+1)', () => {
    // 2026-01-15 12:00 Madrid (CET) === 11:00 UTC
    expect(madridTimeToMs('2026-01-15', '12:00')).toBe(Date.UTC(2026, 0, 15, 11, 0, 0))
  })

  it('treats summer wall-clock as CEST (UTC+2)', () => {
    // 2026-07-15 12:00 Madrid (CEST) === 10:00 UTC
    expect(madridTimeToMs('2026-07-15', '12:00')).toBe(Date.UTC(2026, 6, 15, 10, 0, 0))
  })

  it('accepts HH:MM:SS', () => {
    expect(madridTimeToMs('2026-01-15', '12:30:45')).toBe(Date.UTC(2026, 0, 15, 11, 30, 45))
  })

  it('is monotonic across the spring DST jump', () => {
    // DST starts 2026-03-29 in Madrid; ordering must still hold.
    const before = madridTimeToMs('2026-03-29', '01:00')
    const after = madridTimeToMs('2026-03-29', '04:00')
    expect(after).toBeGreaterThan(before)
  })
})

describe('hoursUntilMadrid', () => {
  const now = madridTimeToMs('2026-01-15', '12:00')

  it('returns positive hours for a future slot', () => {
    expect(hoursUntilMadrid('2026-01-15', '14:00', now)).toBeCloseTo(2, 6)
  })

  it('returns negative hours for a past slot', () => {
    expect(hoursUntilMadrid('2026-01-15', '10:00', now)).toBeCloseTo(-2, 6)
  })

  it('returns 0 at the exact slot time', () => {
    expect(hoursUntilMadrid('2026-01-15', '12:00', now)).toBe(0)
  })
})
