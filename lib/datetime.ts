// Slot dates/times are stored and shown as Spain wall-clock (Europe/Madrid).
// The server runs in UTC (Vercel), so a naive `new Date(`${date}T${time}`)`
// misreads them by the Madrid offset (1h CET / 2h CEST), making "hours until"
// checks and reminders fire 1–2h off. These helpers convert a Madrid
// wall-clock date+time into a real UTC instant — DST-aware, zero dependencies.
//
// Use everywhere slot date+time is turned into an instant for time-window math
// (booking advance, cancel/reschedule windows, reminders) so client and server
// agree regardless of where the code runs.

const TZ = 'Europe/Madrid'

/** Offset (ms) of Europe/Madrid from UTC at a given UTC instant. */
function tzOffsetMs(utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const m: Record<string, number> = {}
  for (const p of dtf.formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') m[p.type] = Number(p.value)
  }
  const hour = m.hour === 24 ? 0 : m.hour // some engines emit 24 at midnight
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, hour, m.minute, m.second)
  return asUTC - utcMs
}

/**
 * Epoch ms for a Madrid wall-clock date+time.
 * @param date 'YYYY-MM-DD'
 * @param time 'HH:MM' or 'HH:MM:SS'
 */
export function madridTimeToMs(date: string, time: string): number {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi, se] = time.split(':').map(Number)
  const naiveUTC = Date.UTC(y, mo - 1, d, h, mi, se || 0)
  // Two-pass offset correction: robust across DST except the ~1h ambiguous
  // fall-back window (irrelevant for a barbershop schedule).
  const off1 = tzOffsetMs(naiveUTC)
  const off2 = tzOffsetMs(naiveUTC - off1)
  return naiveUTC - off2
}

/** Hours from `now` until a Madrid wall-clock slot. Negative if the slot is past. */
export function hoursUntilMadrid(date: string, time: string, now: number = Date.now()): number {
  return (madridTimeToMs(date, time) - now) / 3_600_000
}
