import { describe, it, expect } from 'vitest'
import {
  bookAppointmentSchema,
  adminCreateAppointmentSchema,
  adminEditAppointmentSchema,
  bulkCreateSlotsSchema,
  updateProfileSchema,
} from '@/lib/validations'

const validBooking = {
  slot_date: '2099-12-21',
  slot_start_time: '10:00',
  slot_end_time: '10:30',
  client_name: 'Juan Pérez',
  client_phone: '600111222',
  notes: 'corte',
}

describe('bookAppointmentSchema', () => {
  it('accepts a valid booking', () => {
    expect(bookAppointmentSchema.safeParse(validBooking).success).toBe(true)
  })

  it('strips spaces from the phone before validating', () => {
    const r = bookAppointmentSchema.safeParse({ ...validBooking, client_phone: '600 11 12 22' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.client_phone).toBe('600111222')
  })

  it('rejects a phone that is not 9 digits', () => {
    expect(bookAppointmentSchema.safeParse({ ...validBooking, client_phone: '12345' }).success).toBe(false)
    expect(bookAppointmentSchema.safeParse({ ...validBooking, client_phone: 'abcdefghi' }).success).toBe(false)
    expect(bookAppointmentSchema.safeParse({ ...validBooking, client_phone: '6001112223' }).success).toBe(false)
  })

  it('rejects a name shorter than 2 chars', () => {
    expect(bookAppointmentSchema.safeParse({ ...validBooking, client_name: 'A' }).success).toBe(false)
  })

  it('rejects malformed date / time', () => {
    expect(bookAppointmentSchema.safeParse({ ...validBooking, slot_date: '21-12-2099' }).success).toBe(false)
    expect(bookAppointmentSchema.safeParse({ ...validBooking, slot_start_time: '9:00' }).success).toBe(false)
    expect(bookAppointmentSchema.safeParse({ ...validBooking, slot_start_time: '10:00:00' }).success).toBe(false)
  })

  it('rejects notes over 500 chars', () => {
    expect(bookAppointmentSchema.safeParse({ ...validBooking, notes: 'x'.repeat(501) }).success).toBe(false)
  })

  it('allows notes to be omitted', () => {
    const { notes, ...noNotes } = validBooking
    void notes
    expect(bookAppointmentSchema.safeParse(noNotes).success).toBe(true)
  })
})

describe('adminCreateAppointmentSchema', () => {
  it('accepts without barber_id (optional)', () => {
    const { notes, ...base } = validBooking
    void notes
    expect(adminCreateAppointmentSchema.safeParse(base).success).toBe(true)
  })

  it('accepts a valid uuid barber_id', () => {
    const r = adminCreateAppointmentSchema.safeParse({ ...validBooking, barber_id: '4a10561a-0d9f-4357-a3b7-bbcdab9f0f9e' })
    expect(r.success).toBe(true)
  })

  it('rejects a non-uuid barber_id', () => {
    expect(adminCreateAppointmentSchema.safeParse({ ...validBooking, barber_id: 'rodrigo' }).success).toBe(false)
  })
})

describe('adminEditAppointmentSchema', () => {
  it('accepts name + phone + notes', () => {
    expect(adminEditAppointmentSchema.safeParse({ client_name: 'Ana López', client_phone: '611222333' }).success).toBe(true)
  })
  it('rejects bad phone', () => {
    expect(adminEditAppointmentSchema.safeParse({ client_name: 'Ana López', client_phone: '61' }).success).toBe(false)
  })
})

describe('bulkCreateSlotsSchema', () => {
  it('defaults slot_duration to 30', () => {
    const r = bulkCreateSlotsSchema.safeParse({
      date: '2099-12-21', barber_id: '4a10561a-0d9f-4357-a3b7-bbcdab9f0f9e', from_time: '10:00', to_time: '14:00',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.slot_duration).toBe(30)
  })
  it('rejects slot_duration out of range', () => {
    const base = { date: '2099-12-21', barber_id: '4a10561a-0d9f-4357-a3b7-bbcdab9f0f9e', from_time: '10:00', to_time: '14:00' }
    expect(bulkCreateSlotsSchema.safeParse({ ...base, slot_duration: 5 }).success).toBe(false)
    expect(bulkCreateSlotsSchema.safeParse({ ...base, slot_duration: 200 }).success).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  it('accepts valid name + phone', () => {
    expect(updateProfileSchema.safeParse({ full_name: 'Juan Pérez', phone: '600111222' }).success).toBe(true)
  })
  it('rejects bad phone', () => {
    expect(updateProfileSchema.safeParse({ full_name: 'Juan Pérez', phone: 'xxx' }).success).toBe(false)
  })
})
