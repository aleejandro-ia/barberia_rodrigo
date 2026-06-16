import { describe, it, expect } from 'vitest'
import {
  madridHourNow,
  madridTodayISO,
  greeting,
  classifyDay,
  computeDayStats,
} from '@/lib/today'
import { madridTimeToMs } from '@/lib/datetime'
import type { AgendaSlot, Appointment, AvailabilitySlot, Service } from '@/types'

function slot(p: Partial<AvailabilitySlot> & { start_time: string; end_time: string }): AvailabilitySlot {
  return {
    id: `slot-${p.start_time}`,
    date: '2026-01-15',
    is_available: true,
    ...p,
  }
}

function appt(p: Partial<Appointment> & { status: Appointment['status']; start: string; end: string }): Appointment {
  return {
    id: `appt-${p.start}`,
    slot_date: '2026-01-15',
    slot_start_time: p.start,
    slot_end_time: p.end,
    client_name: 'Test',
    client_phone: '600000000',
    status: p.status,
    created_at: '2026-01-01T00:00:00Z',
    notes: p.notes,
  }
}

function agendaSlot(start: string, end: string, appointment: Appointment | null, available = true): AgendaSlot {
  return { slot: slot({ start_time: start, end_time: end, is_available: available }), appointment }
}

describe('madridHourNow / madridTodayISO', () => {
  it('reads the Madrid wall-clock hour from a UTC instant', () => {
    // 11:00 UTC in winter === 12:00 Madrid
    expect(madridHourNow(Date.UTC(2026, 0, 15, 11, 0, 0))).toBe(12)
  })

  it('rolls the date forward past Madrid midnight', () => {
    // 23:30 UTC winter === 00:30 next-day Madrid
    expect(madridTodayISO(Date.UTC(2026, 0, 15, 23, 30, 0))).toBe('2026-01-16')
  })
})

describe('greeting', () => {
  it('morning before 12', () => expect(greeting(Date.UTC(2026, 0, 15, 8, 0, 0))).toBe('Buenos días'))
  it('afternoon 12–21', () => expect(greeting(Date.UTC(2026, 0, 15, 16, 0, 0))).toBe('Buenas tardes'))
  it('night after 21', () => expect(greeting(Date.UTC(2026, 0, 15, 21, 0, 0))).toBe('Buenas noches'))
})

describe('classifyDay', () => {
  const now = madridTimeToMs('2026-01-15', '12:15')

  it('picks the in-progress and next confirmed appointments', () => {
    const slots: AgendaSlot[] = [
      agendaSlot('10:00', '10:30', appt({ status: 'confirmed', start: '10:00', end: '10:30' })), // past
      agendaSlot('12:00', '12:30', appt({ status: 'confirmed', start: '12:00', end: '12:30' })), // current
      agendaSlot('13:00', '13:30', appt({ status: 'confirmed', start: '13:00', end: '13:30' })), // next
    ]
    const r = classifyDay(slots, now)
    expect(r.current?.slot.start_time).toBe('12:00')
    expect(r.current?.minutesLeft).toBe(15)
    expect(r.next?.slot.start_time).toBe('13:00')
    expect(r.next?.minutesUntil).toBe(45)
    expect(r.confirmed).toHaveLength(3)
  })

  it('ignores non-confirmed appointments', () => {
    const slots: AgendaSlot[] = [
      agendaSlot('12:00', '12:30', appt({ status: 'completed', start: '12:00', end: '12:30' })),
      agendaSlot('13:00', '13:30', appt({ status: 'cancelled', start: '13:00', end: '13:30' })),
    ]
    const r = classifyDay(slots, now)
    expect(r.current).toBeNull()
    expect(r.next).toBeNull()
    expect(r.confirmed).toHaveLength(0)
  })
})

describe('computeDayStats', () => {
  const services: Service[] = [
    { id: 's1', name: 'Corte', price_eur: 15, duration_minutes: 30, is_active: true, display_order: 0 },
  ]

  it('counts statuses, skips blocked, and prices best-effort', () => {
    const slots: AgendaSlot[] = [
      agendaSlot('09:00', '09:30', appt({ status: 'confirmed', start: '09:00', end: '09:30', notes: 'Corte' })),
      agendaSlot('10:00', '10:30', appt({ status: 'completed', start: '10:00', end: '10:30', notes: 'corte' })), // case-insensitive
      agendaSlot('11:00', '11:30', appt({ status: 'no_show', start: '11:00', end: '11:30' })),
      agendaSlot('12:00', '12:30', null), // free
      agendaSlot('13:00', '13:30', null, false), // blocked → ignored
      agendaSlot('14:00', '14:30', appt({ status: 'confirmed', start: '14:00', end: '14:30', notes: 'Barba' })), // unpriced
    ]
    const r = computeDayStats(slots, services)
    expect(r.confirmedCount).toBe(2)
    expect(r.completedCount).toBe(1)
    expect(r.noShowCount).toBe(1)
    expect(r.freeCount).toBe(1)
    expect(r.revenueEur).toBe(30) // Corte + corte
    expect(r.revenuePartial).toBe(true) // Barba unmatched
  })
})
