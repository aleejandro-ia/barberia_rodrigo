// Pure helpers for the admin "Hoy" panel. No React, no side effects.
// Slot times are Europe/Madrid wall-clock — reuse madridTimeToMs so "now / next"
// math agrees with the rest of the app regardless of server timezone.

import { madridTimeToMs } from '@/lib/datetime'
import type { AgendaSlot, Appointment, Service } from '@/types'

const TZ = 'Europe/Madrid'

/** Current hour (0–23) in Europe/Madrid. */
export function madridHourNow(now: number = Date.now()): number {
  const h = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour12: false,
    hour: '2-digit',
  }).format(new Date(now))
  const n = Number(h)
  return n === 24 ? 0 : n
}

/** Today's date as 'YYYY-MM-DD' in Europe/Madrid. */
export function madridTodayISO(now: number = Date.now()): string {
  // en-CA gives ISO-like YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now))
}

/** Greeting based on Madrid hour. */
export function greeting(now: number = Date.now()): string {
  const h = madridHourNow(now)
  if (h < 12) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export interface DayClassification {
  /** Confirmed appointment in progress right now (start ≤ now < end), or null. */
  current: { appt: Appointment; slot: AgendaSlot['slot']; minutesLeft: number } | null
  /** Next confirmed appointment starting after now, or null. */
  next: { appt: Appointment; slot: AgendaSlot['slot']; minutesUntil: number } | null
  /** All confirmed appointments today, sorted by start. */
  confirmed: AgendaSlot[]
}

/**
 * Classify today's slots into current / next confirmed appointments.
 * Only 'confirmed' appointments are considered "live" (completed = past, etc.).
 */
export function classifyDay(slots: AgendaSlot[], now: number = Date.now()): DayClassification {
  const confirmed = slots
    .filter((s) => s.appointment?.status === 'confirmed')
    .sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time))

  let current: DayClassification['current'] = null
  let next: DayClassification['next'] = null

  for (const s of confirmed) {
    const startMs = madridTimeToMs(s.slot.date, s.slot.start_time)
    const endMs = madridTimeToMs(s.slot.date, s.slot.end_time)
    if (startMs <= now && now < endMs && !current) {
      current = { appt: s.appointment!, slot: s.slot, minutesLeft: Math.max(0, Math.round((endMs - now) / 60000)) }
    }
    if (startMs > now && !next) {
      next = { appt: s.appointment!, slot: s.slot, minutesUntil: Math.round((startMs - now) / 60000) }
    }
  }

  return { current, next, confirmed }
}

export interface DayStats {
  confirmedCount: number
  completedCount: number
  noShowCount: number
  freeCount: number
  /** Best-effort estimated revenue (€) — only matched services count. */
  revenueEur: number
  /** True when at least one billable appointment could not be priced. */
  revenuePartial: boolean
}

/**
 * Compute header stats for the day.
 * Revenue is best-effort: appointment.notes is matched (case-insensitive) against
 * active service names. Unmatched billable appts are flagged via revenuePartial.
 */
export function computeDayStats(slots: AgendaSlot[], services: Service[]): DayStats {
  // Caller passes already-active services (/api/services filters is_active).
  // Don't gate on sv.is_active here — that field isn't always present in the payload.
  const priceByName = new Map<string, number>()
  for (const sv of services) {
    if (sv.is_active === false) continue
    priceByName.set(sv.name.trim().toLowerCase(), Number(sv.price_eur) || 0)
  }

  let confirmedCount = 0
  let completedCount = 0
  let noShowCount = 0
  let freeCount = 0
  let revenueEur = 0
  let revenuePartial = false

  for (const s of slots) {
    const appt = s.appointment
    if (!s.slot.is_available) continue // blocked — not free, not billable
    if (!appt) {
      freeCount++
      continue
    }
    if (appt.status === 'confirmed') confirmedCount++
    else if (appt.status === 'completed') completedCount++
    else if (appt.status === 'no_show') noShowCount++

    // Billable = confirmed (expected) or completed (done)
    if (appt.status === 'confirmed' || appt.status === 'completed') {
      const key = (appt.notes ?? '').trim().toLowerCase()
      const price = key ? priceByName.get(key) : undefined
      if (price != null) revenueEur += price
      else revenuePartial = true
    }
  }

  return { confirmedCount, completedCount, noShowCount, freeCount, revenueEur, revenuePartial }
}
