'use client'

import { useMemo } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import AgendaSlotRow from '@/components/admin/agenda/AgendaSlotRow'
import { madridTimeToMs } from '@/lib/datetime'
import type { AgendaDay, AvailabilitySlot, Appointment } from '@/types'

interface TodayTimelineProps {
  day: AgendaDay | null
  loading: boolean
  nowMs: number
  barberMap: Map<string, string>
  barberCount: number
  onBlock: (slot: AvailabilitySlot) => void
  onEditSlot: (slot: AvailabilitySlot) => void
  onCreateAppointment: (slot: AvailabilitySlot) => void
  onEditAppointment: (appointment: Appointment) => void
  onCancelAppointment: (appointment: Appointment) => void
  onRescheduleAppointment: (appointment: Appointment) => void
  onMarkNoShow: (appointment: Appointment) => void
  onMarkCompleted: (appointment: Appointment) => void
  onViewClientHistory: (appointment: Appointment) => void
}

function NowLine() {
  return (
    <div className="flex items-center gap-2 py-1" aria-hidden>
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: '#C9A96E' }} />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#C9A96E' }} />
      </span>
      <span className="uppercase tracking-[0.16em] font-semibold flex-shrink-0" style={{ color: '#C9A96E', fontSize: '0.62rem' }}>
        Ahora
      </span>
      <span className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(201,169,110,0.4), transparent)' }} />
    </div>
  )
}

export default function TodayTimeline({
  day, loading, nowMs, barberMap, barberCount,
  onBlock, onEditSlot, onCreateAppointment, onEditAppointment, onCancelAppointment,
  onRescheduleAppointment, onMarkNoShow, onMarkCompleted, onViewClientHistory,
}: TodayTimelineProps) {
  const sorted = useMemo(() => {
    const slots = day?.slots ?? []
    return [...slots].sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time))
  }, [day])

  // Index of the first slot starting in the future → "now line" goes before it.
  const nowLineIndex = useMemo(() => {
    const idx = sorted.findIndex((s) => madridTimeToMs(s.slot.date, s.slot.start_time) > nowMs)
    return idx
  }, [sorted, nowMs])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ height: 96, backgroundColor: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.06)' }} />
        ))}
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center gap-3 py-12 rounded-3xl"
        style={{ backgroundColor: '#161310', border: '1px dashed rgba(201,169,110,0.18)' }}
      >
        <CalendarBlank size={34} weight="duotone" style={{ color: '#C9A96E' }} />
        <div>
          <p className="font-semibold" style={{ color: '#F2EDE7', fontSize: '1rem' }}>No hay franjas hoy</p>
          <p className="mt-1" style={{ color: '#7A7268', fontSize: '0.85rem' }}>Crea huecos desde la Agenda para empezar el día.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((agendaSlot, i) => {
        const endMs = madridTimeToMs(agendaSlot.slot.date, agendaSlot.slot.end_time)
        const isPast = endMs <= nowMs
        return (
          <div key={agendaSlot.slot.id}>
            {i === nowLineIndex && <div className="mb-3"><NowLine /></div>}
            <div style={{ opacity: isPast ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <AgendaSlotRow
                agendaSlot={agendaSlot}
                onBlock={onBlock}
                onEditSlot={onEditSlot}
                onCreateAppointment={onCreateAppointment}
                onEditAppointment={onEditAppointment}
                onCancelAppointment={onCancelAppointment}
                onRescheduleAppointment={onRescheduleAppointment}
                onMarkNoShow={onMarkNoShow}
                onMarkCompleted={onMarkCompleted}
                onViewClientHistory={onViewClientHistory}
                barberMap={barberMap}
                barberCount={barberCount}
              />
            </div>
          </div>
        )
      })}
      {/* now line after all slots when everything is in the past */}
      {nowLineIndex === -1 && <NowLine />}
    </div>
  )
}
