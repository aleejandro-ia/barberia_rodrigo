import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Mock the server-action dependencies so we exercise the REAL guard logic
//    inside the actions without a database or Next request context. ──────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUser: vi.fn(), isAdmin: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/actions/bookingSettings', () => ({ getBookingSettings: vi.fn() }))
vi.mock('@/lib/datetime', async (orig) => ({
  ...(await orig<typeof import('@/lib/datetime')>()),
  hoursUntilMadrid: vi.fn(),
}))

import { getUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getBookingSettings } from '@/actions/bookingSettings'
import { hoursUntilMadrid } from '@/lib/datetime'
import { bookAppointment } from '@/actions/appointments'
// adminCreateAppointment / adminToggleSlotBlock / adminEditSlotTimes live in actions/agenda
import * as agenda from '@/actions/agenda'

type Result = { data: unknown; error?: unknown }

// Programmable Supabase stub: per-table FIFO of terminal (maybeSingle/single)
// results, consumed in the same order the action calls them. Intermediate
// chain methods (select/eq/limit/…) are no-ops returning the builder.
function makeSupabase(queues: Record<string, Result[]>) {
  const used: Record<string, number> = {}
  const next = (table: string): Promise<Result> => {
    const q = queues[table] ?? []
    const i = used[table] ?? 0
    used[table] = i + 1
    return Promise.resolve(q[i] ?? { data: null, error: null })
  }
  const builder = (table: string) => {
    const b: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'neq', 'gte', 'lte', 'is', 'in', 'not', 'order', 'limit', 'insert', 'update', 'upsert', 'delete']) {
      b[m] = () => b
    }
    b.maybeSingle = () => next(table)
    b.single = () => next(table)
    return b
  }
  return { from: (t: string) => builder(t) } as unknown
}

const validBooking = {
  slot_date: '2099-12-21', slot_start_time: '10:00', slot_end_time: '10:30',
  client_name: 'Juan Pérez', client_phone: '600111222', notes: 'corte',
}
const SETTINGS = { bookings_enabled: true, min_hours_advance: 2, business_name: 'BG Barber' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getUser).mockResolvedValue({ id: 'user-1', email: 'cliente@example.com' } as never)
  vi.mocked(isAdmin).mockReturnValue(true)
  vi.mocked(getBookingSettings).mockResolvedValue(SETTINGS as never)
  vi.mocked(hoursUntilMadrid).mockReturnValue(100) // far in the future by default
  // default: happy path for bookAppointment
  vi.mocked(createClient).mockResolvedValue(makeSupabase({
    availability_slots: [{ data: { id: 'slot-1', barber_id: null } }],
    appointments: [
      { data: null },                                                                 // existing-check: free
      { data: { id: 'appt-1', slot_date: '2099-12-21', slot_start_time: '10:00', status: 'confirmed' } }, // insert
    ],
    profiles: [{ data: { full_name: 'Juan', phone: '600111222' } }],                  // both present → no update
  }) as never)
})

describe('bookAppointment — client booking guards', () => {
  it('rejects invalid input → VALIDATION_ERROR', async () => {
    expect(await bookAppointment({})).toEqual({ error: 'VALIDATION_ERROR' })
  })

  it('rejects when not logged in → UNAUTHORIZED', async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    expect(await bookAppointment(validBooking)).toEqual({ error: 'UNAUTHORIZED' })
  })

  it('rejects when bookings are disabled → BOOKINGS_DISABLED', async () => {
    vi.mocked(getBookingSettings).mockResolvedValue({ ...SETTINGS, bookings_enabled: false } as never)
    expect(await bookAppointment(validBooking)).toEqual({ error: 'BOOKINGS_DISABLED' })
  })

  it('rejects booking too close to the slot → TOO_SOON', async () => {
    vi.mocked(hoursUntilMadrid).mockReturnValue(1) // < min_hours_advance (2)
    expect(await bookAppointment(validBooking)).toEqual({ error: 'TOO_SOON' })
  })

  it('rejects when the slot does not exist / not available → SLOT_NOT_FOUND', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ availability_slots: [{ data: null }] }) as never)
    expect(await bookAppointment(validBooking)).toEqual({ error: 'SLOT_NOT_FOUND' })
  })

  it('rejects when the slot is already taken → SLOT_TAKEN', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({
      availability_slots: [{ data: { id: 'slot-1', barber_id: null } }],
      appointments: [{ data: { id: 'other' } }], // existing confirmed
    }) as never)
    expect(await bookAppointment(validBooking)).toEqual({ error: 'SLOT_TAKEN' })
  })

  it('books successfully on the happy path', async () => {
    const res = await bookAppointment(validBooking)
    expect(res).toHaveProperty('appointment')
    if ('appointment' in res) expect(res.appointment.id).toBe('appt-1')
  })
})

describe('admin agenda guards', () => {
  it('adminCreateAppointment blocks non-admin → UNAUTHORIZED', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)
    expect(await agenda.adminCreateAppointment(validBooking)).toEqual({ error: 'UNAUTHORIZED' })
  })

  it('adminCreateAppointment rejects bad input → VALIDATION_ERROR', async () => {
    expect(await agenda.adminCreateAppointment({})).toEqual({ error: 'VALIDATION_ERROR' })
  })

  it('adminCreateAppointment → SLOT_NOT_FOUND when slot missing', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ availability_slots: [{ data: null }] }) as never)
    expect(await agenda.adminCreateAppointment(validBooking)).toEqual({ error: 'SLOT_NOT_FOUND' })
  })

  it('adminCreateAppointment → SLOT_TAKEN when already booked', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({
      availability_slots: [{ data: { id: 'slot-1', barber_id: null } }],
      appointments: [{ data: { id: 'other' } }],
    }) as never)
    expect(await agenda.adminCreateAppointment(validBooking)).toEqual({ error: 'SLOT_TAKEN' })
  })

  it('adminToggleSlotBlock → HAS_BOOKING when slot has a confirmed appt', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({
      availability_slots: [{ data: { id: 'slot-1', date: '2099-12-21', start_time: '10:00', barber_id: null } }],
      appointments: [{ data: { id: 'confirmed-1' } }],
    }) as never)
    expect(await agenda.adminToggleSlotBlock('slot-1', true)).toEqual({ error: 'HAS_BOOKING' })
  })

  it('adminToggleSlotBlock → NOT_FOUND when slot missing', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ availability_slots: [{ data: null }] }) as never)
    expect(await agenda.adminToggleSlotBlock('nope', true)).toEqual({ error: 'NOT_FOUND' })
  })

  it('adminToggleSlotBlock blocks a free slot successfully', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({
      availability_slots: [{ data: { id: 'slot-1', date: '2099-12-21', start_time: '10:00', barber_id: null } }],
      appointments: [{ data: null }],
    }) as never)
    expect(await agenda.adminToggleSlotBlock('slot-1', true)).toEqual({ success: true })
  })

  it('adminEditSlotTimes → VALIDATION_ERROR when end <= start', async () => {
    expect(await agenda.adminEditSlotTimes('slot-1', { start_time: '11:00', end_time: '10:00' })).toEqual({ error: 'VALIDATION_ERROR' })
  })

  it('adminEditSlotTimes → HAS_BOOKING when confirmed appt on slot', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({
      availability_slots: [{ data: { id: 'slot-1', date: '2099-12-21', start_time: '10:00', barber_id: null } }],
      appointments: [{ data: { id: 'confirmed-1' } }],
    }) as never)
    expect(await agenda.adminEditSlotTimes('slot-1', { start_time: '10:15', end_time: '10:45' })).toEqual({ error: 'HAS_BOOKING' })
  })

  it('adminEditSlotTimes → DUPLICATE_SLOT when another slot has the new start', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({
      availability_slots: [
        { data: { id: 'slot-1', date: '2099-12-21', start_time: '10:00', barber_id: null } }, // fetch
        { data: { id: 'slot-2' } },                                                            // conflict
      ],
      appointments: [{ data: null }],
    }) as never)
    expect(await agenda.adminEditSlotTimes('slot-1', { start_time: '10:15', end_time: '10:45' })).toEqual({ error: 'DUPLICATE_SLOT' })
  })

  it('adminEditSlotTimes succeeds when free and unique', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({
      availability_slots: [
        { data: { id: 'slot-1', date: '2099-12-21', start_time: '10:00', barber_id: null } },
        { data: null }, // no conflict
      ],
      appointments: [{ data: null }],
    }) as never)
    expect(await agenda.adminEditSlotTimes('slot-1', { start_time: '10:15', end_time: '10:45' })).toEqual({ success: true })
  })
})
