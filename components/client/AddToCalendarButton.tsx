'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarBlank, CaretDown } from '@phosphor-icons/react'
import type { Appointment } from '@/types'
import type { CalendarEvent } from '@/lib/calendar/ics'
import { downloadICS } from '@/lib/calendar/ics'
import { buildGoogleCalendarUrl } from '@/lib/calendar/googleCalendarUrl'

interface AddToCalendarButtonProps {
  appointment: Appointment
  businessName?: string
}

function appointmentToCalendarEvent(appt: Appointment, businessName: string): CalendarEvent {
  return {
    title: `Cita en ${businessName}`,
    date: appt.slot_date,
    startTime: appt.slot_start_time.slice(0, 5),
    endTime: appt.slot_end_time.slice(0, 5),
    description: appt.notes ? `Servicio: ${appt.notes}` : undefined,
  }
}

export default function AddToCalendarButton({
  appointment,
  businessName = 'BG Barber',
}: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const event = appointmentToCalendarEvent(appointment, businessName)

  function handleGoogle() {
    const url = buildGoogleCalendarUrl(event)
    window.open(url, '_blank')
    setOpen(false)
  }

  function handleICS() {
    downloadICS(event)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
        style={{
          color: '#C9A96E',
          border: '1px solid rgba(201,169,110,0.25)',
          backgroundColor: 'rgba(201,169,110,0.06)',
        }}
      >
        <CalendarBlank size={14} weight="bold" />
        Añadir al calendario
        <CaretDown
          size={12}
          weight="bold"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 min-w-[180px] rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: '#1A1612',
            border: '1px solid rgba(201,169,110,0.18)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={handleGoogle}
            className="w-full text-left px-4 py-3 text-sm transition-colors duration-100 hover:bg-white/5"
            style={{ color: '#F2EDE7' }}
          >
            Google Calendar
          </button>
          <div style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }} />
          <button
            onClick={handleICS}
            className="w-full text-left px-4 py-3 text-sm transition-colors duration-100 hover:bg-white/5"
            style={{ color: '#F2EDE7' }}
          >
            Apple iCal
          </button>
          <div style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }} />
          <button
            onClick={handleICS}
            className="w-full text-left px-4 py-3 text-sm transition-colors duration-100 hover:bg-white/5"
            style={{ color: '#F2EDE7' }}
          >
            Outlook
          </button>
        </div>
      )}
    </div>
  )
}
