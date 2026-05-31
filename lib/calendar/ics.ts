export interface CalendarEvent {
  title: string
  date: string        // 'YYYY-MM-DD'
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
  description?: string
  location?: string
}

function fmt(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateICS(event: CalendarEvent): string {
  const uid = `${Date.now()}-bgbarber@bgbarber.es`
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BG Barber//Booking//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`, `DTSTAMP:${now}Z`,
    `DTSTART;TZID=Europe/Madrid:${fmt(event.date, event.startTime)}`,
    `DTEND;TZID=Europe/Madrid:${fmt(event.date, event.endTime)}`,
    `SUMMARY:${esc(event.title)}`,
    event.description ? `DESCRIPTION:${esc(event.description)}` : '',
    event.location    ? `LOCATION:${esc(event.location)}`       : '',
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de cita en BG Barber', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

export function downloadICS(event: CalendarEvent): void {
  const blob = new Blob([generateICS(event)], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'cita-bgbarber.ics'; a.click()
  URL.revokeObjectURL(url)
}
