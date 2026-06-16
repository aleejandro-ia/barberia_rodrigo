import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  autoCompletePastAppointments,
  autoCompletePastAppointmentsThrottled,
} from '@/lib/autoComplete'

type Row = { id: string; slot_date: string; slot_end_time: string }

// Minimal chainable stub of the Supabase query builder. Filters are ignored —
// `rows` stands in for whatever the DB would return; the unit under test is the
// in-JS time filter and the update call.
function makeAdmin(rows: Row[]) {
  const captured = { ids: null as string[] | null }
  const admin = {
    from() {
      const b = {
        select: () => b,
        eq: () => b,
        lte: () => Promise.resolve({ data: rows }),
        update: () => b,
        in: (_col: string, ids: string[]) => {
          captured.ids = ids
          return Promise.resolve({ error: null })
        },
      }
      return b
    },
  }
  return { admin: admin as unknown as SupabaseClient, captured }
}

describe('autoCompletePastAppointments', () => {
  it('completes only appointments whose end time is in the past', async () => {
    const { admin, captured } = makeAdmin([
      { id: 'past', slot_date: '2020-01-01', slot_end_time: '10:30' },
      { id: 'future', slot_date: '2090-01-01', slot_end_time: '10:30' },
    ])
    const n = await autoCompletePastAppointments(admin)
    expect(n).toBe(1)
    expect(captured.ids).toEqual(['past'])
  })

  it('returns 0 and writes nothing when there is nothing to complete', async () => {
    const { admin, captured } = makeAdmin([
      { id: 'future', slot_date: '2090-01-01', slot_end_time: '10:30' },
    ])
    const n = await autoCompletePastAppointments(admin)
    expect(n).toBe(0)
    expect(captured.ids).toBeNull()
  })
})

describe('autoCompletePastAppointmentsThrottled', () => {
  it('runs the first call and skips subsequent calls within the window', async () => {
    const { admin, captured } = makeAdmin([
      { id: 'past', slot_date: '2020-01-01', slot_end_time: '10:30' },
    ])
    const first = await autoCompletePastAppointmentsThrottled(admin)
    expect(first).toBe(1)
    expect(captured.ids).toEqual(['past'])

    captured.ids = null
    const second = await autoCompletePastAppointmentsThrottled(admin)
    expect(second).toBe(0)
    expect(captured.ids).toBeNull() // underlying not invoked
  })
})
