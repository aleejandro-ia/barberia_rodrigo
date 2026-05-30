'use client'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus } from '@phosphor-icons/react'
import AgendaSlotRow from './AgendaSlotRow'
import type { AgendaDay, AvailabilitySlot, Appointment } from '@/types'

interface AgendaDayPanelProps {
  day:                   AgendaDay | null
  onBlock:               (slot: AvailabilitySlot) => void
  onEditSlot:            (slot: AvailabilitySlot) => void
  onCreateAppointment:   (slot: AvailabilitySlot) => void
  onEditAppointment:     (appointment: Appointment) => void
  onCancelAppointment:   (appointment: Appointment) => void
  onOpenBulkCreator:     (date: string) => void
}

export default function AgendaDayPanel({
  day,
  onBlock,
  onEditSlot,
  onCreateAppointment,
  onEditAppointment,
  onCancelAppointment,
  onOpenBulkCreator,
}: AgendaDayPanelProps) {
  if (!day) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.08)', minHeight: 200 }}
      >
        <span className="text-2xl mb-3" style={{ opacity: 0.2 }}>📅</span>
        <p className="text-sm font-medium" style={{ color: '#4A4540' }}>
          Selecciona un día para ver los huecos
        </p>
      </div>
    )
  }

  const dateLabel = format(parseISO(day.date), "EEEE, d 'de' MMMM", { locale: es })
  const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(201,169,110,0.08)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F2EDE7' }}>
            {dateCapitalized}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#4A4540' }}>
            {day.confirmedCount > 0 && `${day.confirmedCount} cita${day.confirmedCount > 1 ? 's' : ''}`}
            {day.freeCount > 0 && ` · ${day.freeCount} libre${day.freeCount > 1 ? 's' : ''}`}
            {day.blockedCount > 0 && ` · ${day.blockedCount} bloqueado${day.blockedCount > 1 ? 's' : ''}`}
            {day.totalSlots === 0 && 'Sin franjas'}
          </p>
        </div>

        <button
          onClick={() => onOpenBulkCreator(day.date)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: 'rgba(201,169,110,0.1)',
            color:           '#C9A96E',
            border:          '1px solid rgba(201,169,110,0.2)',
            cursor:          'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.1)')}
        >
          <Plus size={11} weight="bold" />
          Franjas
        </button>
      </div>

      {/* Slots list */}
      <div className="flex flex-col gap-1.5 p-3 overflow-y-auto" style={{ maxHeight: 520 }}>
        {day.slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm" style={{ color: '#3A3530' }}>
              Sin franjas horarias
            </p>
            <button
              onClick={() => onOpenBulkCreator(day.date)}
              className="mt-3 text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: '#C9A96E', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              + Crear franjas
            </button>
          </div>
        ) : (
          day.slots.map((agendaSlot) => (
            <AgendaSlotRow
              key={agendaSlot.slot.id}
              agendaSlot={agendaSlot}
              onBlock={onBlock}
              onEditSlot={onEditSlot}
              onCreateAppointment={onCreateAppointment}
              onEditAppointment={onEditAppointment}
              onCancelAppointment={onCancelAppointment}
            />
          ))
        )}
      </div>
    </div>
  )
}
