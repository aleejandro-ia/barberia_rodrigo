import type { CalendarEvent } from './ics'

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const fmt = (d: string, t: string) => `${d.replace(/-/g, '')}T${t.replace(':', '')}00`
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     event.title,
    dates:    `${fmt(event.date, event.startTime)}/${fmt(event.date, event.endTime)}`,
    details:  event.description ?? '',
    location: event.location ?? '',
    ctz:      'Europe/Madrid',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
