'use client'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus } from '@phosphor-icons/react'
import AgendaSlotRow from './AgendaSlotRow'
import type { AgendaDay, AvailabilitySlot, Appointment } from '@/types'

interface AgendaDayPanelProps {
  day:                      AgendaDay | null
  loading?:                 boolean
  onBlock:                  (slot: AvailabilitySlot) => void
  onEditSlot:               (slot: AvailabilitySlot) => void
  onCreateAppointment:      (slot: AvailabilitySlot) => void
  onEditAppointment:        (appointment: Appointment) => void
  onCancelAppointment:      (appointment: Appointment) => void
  onOpenBulkCreator:        (date: string) => void
  onRescheduleAppointment?: (appointment: Appointment) => void
  onMarkNoShow?:             (appointment: Appointment) => void
  onMarkCompleted?:          (appointment: Appointment) => void
  onViewClientHistory?:      (appointment: Appointment) => void
  barberMap?:                Map<string, string>
  barberCount?:              number
}

export default function AgendaDayPanel({
  day,
  loading,
  onBlock,
  onEditSlot,
  onCreateAppointment,
  onEditAppointment,
  onCancelAppointment,
  onOpenBulkCreator,
  onRescheduleAppointment,
  onMarkNoShow,
  onMarkCompleted,
  onViewClientHistory,
  barberMap,
  barberCount = 0,
}: AgendaDayPanelProps) {
  if (!day && !loading) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-12 px-6 text-center"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.08)' }}
      >
        <p className="text-sm font-medium" style={{ color: '#4A4540' }}>
          Selecciona un día para ver las citas
        </p>
      </div>
    )
  }

  if (loading || !day) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl animate-pulse"
            style={{ height: 140, backgroundColor: 'rgba(201,169,110,0.05)' }}
          />
        ))}
      </div>
    )
  }

  const dateLabel    = format(parseISO(day.date), "EEEE, d 'de' MMMM", { locale: es })
  const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold" style={{ color: '#F2EDE7' }}>
            {dateCapitalized}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#4A4540' }}>
            {day.confirmedCount > 0 && `${day.confirmedCount} cita${day.confirmedCount > 1 ? 's' : ''}`}
            {day.freeCount > 0      && ` · ${day.freeCount} libre${day.freeCount > 1 ? 's' : ''}`}
            {day.blockedCount > 0   && ` · ${day.blockedCount} bloqueado${day.blockedCount > 1 ? 's' : ''}`}
            {day.totalSlots === 0   && 'Sin franjas horarias'}
          </p>
        </div>

        <button
          onClick={() => onOpenBulkCreator(day.date)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: 'rgba(201,169,110,0.1)',
            color:           '#C9A96E',
            border:          '1px solid rgba(201,169,110,0.2)',
            cursor:          'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.18)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.1)')}
        >
          <Plus size={11} weight="bold" />
          Añadir franjas
        </button>
      </div>

      {/* Cards grid */}
      {day.slots.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-12 text-center"
          style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.06)' }}
        >
          <p className="text-sm" style={{ color: '#3A3530' }}>Sin franjas horarias</p>
          <button
            onClick={() => onOpenBulkCreator(day.date)}
            className="mt-3 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: '#C9A96E', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            + Crear franjas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {day.slots.map(agendaSlot => (
            <AgendaSlotRow
              key={agendaSlot.slot.id}
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
          ))}
        </div>
      )}
    </div>
  )
}
