'use client'

import { Plus, Lock, LockOpen, PencilSimple, X, WhatsappLogo, ArrowsClockwise, UserMinus, User, CheckCircle } from '@phosphor-icons/react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { whatsAppReminder } from '@/lib/whatsapp'
import type { AgendaSlot, AvailabilitySlot, Appointment } from '@/types'

interface AgendaSlotRowProps {
  agendaSlot:              AgendaSlot
  onBlock:                 (slot: AvailabilitySlot) => void
  onEditSlot:              (slot: AvailabilitySlot) => void
  onCreateAppointment:     (slot: AvailabilitySlot) => void
  onEditAppointment:       (appointment: Appointment) => void
  onCancelAppointment:     (appointment: Appointment) => void
  onRescheduleAppointment?: (appointment: Appointment) => void
  onMarkNoShow?:            (appointment: Appointment) => void
  onMarkCompleted?:         (appointment: Appointment) => void
  onViewClientHistory?:     (appointment: Appointment) => void
  barberMap?:               Map<string, string>
  barberCount?:             number
}

function timeLabel(t: string) {
  return t.slice(0, 5)
}

function buildWhatsAppUrlForSlot(appt: Appointment, date: string) {
  const time          = timeLabel(appt.slot_start_time)
  const dateFormatted = format(parseISO(date), "d 'de' MMMM", { locale: es })
  return whatsAppReminder(appt.client_phone, appt.client_name, dateFormatted, time)
}

const actionBtn: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  width:          26,
  height:         26,
  borderRadius:   6,
  border:         '1px solid rgba(201,169,110,0.15)',
  backgroundColor:'transparent',
  cursor:         'pointer',
  transition:     'background-color 0.12s',
  flexShrink:     0,
}

export default function AgendaSlotRow({
  agendaSlot,
  onBlock,
  onEditSlot,
  onCreateAppointment,
  onEditAppointment,
  onCancelAppointment,
  onRescheduleAppointment,
  onMarkNoShow,
  onMarkCompleted,
  onViewClientHistory,
  barberMap,
  barberCount = 0,
}: AgendaSlotRowProps) {
  const { slot, appointment: appt } = agendaSlot

  const isBlocked           = !slot.is_available
  const isConfirmed         = !isBlocked && appt?.status === 'confirmed'
  const isCancelled         = !isBlocked && (appt?.status === 'cancelled' || appt?.status === 'cancelled_by_client')
  const isCancelledByAdmin  = !isBlocked && appt?.status === 'cancelled_by_admin'
  const isNoShow            = !isBlocked && appt?.status === 'no_show'
  const isCompleted         = !isBlocked && appt?.status === 'completed'
  const isFree              = !isBlocked && !appt

  // Past slot = slot date is before today
  const isPastSlot = isBefore(startOfDay(parseISO(slot.date)), startOfDay(new Date()))

  /* ─── Visual state ─────────────────────────────────────────── */
  let rowBg     = 'rgba(201,169,110,0.04)'
  let accentColor = 'rgba(201,169,110,0.4)'
  let bgImage   = 'none'
  let borderColor = 'rgba(201,169,110,0.08)'
  let statusBadge: { label: string; color: string } | null = null

  if (isBlocked) {
    rowBg       = 'rgba(255,255,255,0.02)'
    accentColor = '#3A3530'
    borderColor = 'rgba(255,255,255,0.04)'
    bgImage     = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 8px)'
  } else if (isConfirmed) {
    rowBg       = 'rgba(74,222,128,0.06)'
    accentColor = '#4ADE80'
    borderColor = 'rgba(74,222,128,0.12)'
  } else if (isCancelled) {
    rowBg       = 'rgba(255,80,80,0.04)'
    accentColor = 'rgba(255,80,80,0.35)'
    borderColor = 'rgba(255,80,80,0.1)'
  } else if (isCancelledByAdmin) {
    rowBg       = 'rgba(255,160,50,0.06)'
    accentColor = '#FFA032'
    borderColor = 'rgba(255,160,50,0.15)'
    statusBadge = { label: 'Cancelada por barbero', color: '#FFA032' }
  } else if (isNoShow) {
    rowBg       = 'rgba(239,68,68,0.12)'
    accentColor = '#EF4444'
    borderColor = 'rgba(239,68,68,0.2)'
    statusBadge = { label: 'No-show', color: '#EF4444' }
  } else if (isCompleted) {
    rowBg       = 'rgba(255,255,255,0.04)'
    accentColor = '#3A3530'
    borderColor = 'rgba(255,255,255,0.06)'
    statusBadge = { label: '✓ Completada', color: '#4ADE80' }
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150"
      style={{
        backgroundColor: rowBg,
        backgroundImage: bgImage,
        border:          `1px solid ${borderColor}`,
      }}
    >
      {/* Left accent bar */}
      <div
        className="w-0.5 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: accentColor, minHeight: 28 }}
      />

      {/* Time */}
      <div className="flex flex-col flex-shrink-0 w-20">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{
            color:          isBlocked ? '#4A4540' : isConfirmed ? '#4ADE80' : (isCancelled || isCancelledByAdmin) ? 'rgba(255,80,80,0.6)' : isNoShow ? '#EF4444' : isCompleted ? '#7A7268' : '#C9A96E',
            textDecoration: (isCancelled || isCancelledByAdmin) ? 'line-through' : 'none',
          }}
        >
          {timeLabel(slot.start_time)}
        </span>
        <span className="text-xs" style={{ color: '#3A3530' }}>
          {timeLabel(slot.end_time)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isBlocked && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#4A4540' }}>
              Bloqueado
            </span>
            {slot.blocked_reason && (
              <span className="text-xs truncate" style={{ color: '#3A3530' }}>
                — {slot.blocked_reason}
              </span>
            )}
          </div>
        )}

        {(isConfirmed || isCancelled || isCancelledByAdmin || isNoShow || isCompleted) && appt && (
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className="text-sm font-medium truncate"
              style={{
                color:          isConfirmed ? '#F2EDE7' : isCompleted ? '#7A7268' : '#5A5450',
                textDecoration: (isCancelled || isCancelledByAdmin) ? 'line-through' : 'none',
              }}
            >
              {appt.client_name}
            </span>
            <span className="text-xs" style={{ color: '#4A4540' }}>
              {appt.client_phone}
            </span>
            {appt.notes && (
              <span className="text-xs truncate max-w-[120px]" style={{ color: '#4A4540' }}>
                · {appt.notes}
              </span>
            )}
            {/* Walk-in badge */}
            {appt.user_id == null && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: 'rgba(201,169,110,0.12)',
                  color:           '#C9A96E',
                  border:          '1px solid rgba(201,169,110,0.2)',
                }}
              >
                Walk-in
              </span>
            )}
            {/* Barber badge — only when 2+ barbers and barber_id is set */}
            {barberCount >= 2 && appt.barber_id && barberMap?.get(appt.barber_id) && (
              <span
                style={{
                  backgroundColor: 'rgba(201,169,110,0.1)',
                  color:           '#C9A96E',
                  fontSize:        '0.65rem',
                  padding:         '1px 6px',
                  borderRadius:    9999,
                  border:          '1px solid rgba(201,169,110,0.2)',
                  flexShrink:      0,
                }}
              >
                {barberMap.get(appt.barber_id)}
              </span>
            )}
            {/* Status badge for special statuses */}
            {statusBadge && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `${statusBadge.color}18`,
                  color:           statusBadge.color,
                  border:          `1px solid ${statusBadge.color}30`,
                }}
              >
                {statusBadge.label}
              </span>
            )}
          </div>
        )}

        {isFree && (
          <span className="text-xs" style={{ color: '#3A3530' }}>
            Libre
          </span>
        )}
      </div>

      {/* Action buttons — visible on row hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
        {isFree && (
          <>
            <button
              title="Crear cita"
              style={{ ...actionBtn, color: '#C9A96E' }}
              onClick={() => onCreateAppointment(slot)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Plus size={12} weight="bold" />
            </button>
            <button
              title="Bloquear hueco"
              style={{ ...actionBtn, color: '#7A7268' }}
              onClick={() => onBlock(slot)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Lock size={12} />
            </button>
            <button
              title="Editar horas"
              style={{ ...actionBtn, color: '#7A7268' }}
              onClick={() => onEditSlot(slot)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <PencilSimple size={12} />
            </button>
          </>
        )}

        {isConfirmed && appt && (
          <>
            <a
              href={buildWhatsAppUrlForSlot(appt, slot.date)}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir WhatsApp"
              style={{ ...actionBtn, color: '#4ADE80', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <WhatsappLogo size={12} />
            </a>
            {onRescheduleAppointment && (
              <button
                title="Cambiar slot"
                style={{ ...actionBtn, color: '#C9A96E' }}
                onClick={() => onRescheduleAppointment(appt)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ArrowsClockwise size={12} />
              </button>
            )}
            {onViewClientHistory && (
              <button
                title="Ver cliente"
                style={{ ...actionBtn, color: '#7A7268' }}
                onClick={() => onViewClientHistory(appt)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <User size={12} />
              </button>
            )}
            {isPastSlot && onMarkCompleted && (
              <button
                title="Completada"
                style={{ ...actionBtn, color: '#4ADE80' }}
                onClick={() => onMarkCompleted(appt)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <CheckCircle size={12} />
              </button>
            )}
            {onMarkNoShow && (
              <button
                title="No-show"
                style={{ ...actionBtn, color: '#EF4444' }}
                onClick={() => onMarkNoShow(appt)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <UserMinus size={12} />
              </button>
            )}
            <button
              title="Editar cita"
              style={{ ...actionBtn, color: '#7A7268' }}
              onClick={() => onEditAppointment(appt)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <PencilSimple size={12} />
            </button>
            <button
              title="Cancelar cita"
              style={{ ...actionBtn, color: '#FF8080' }}
              onClick={() => onCancelAppointment(appt)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,80,80,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={12} weight="bold" />
            </button>
          </>
        )}

        {isBlocked && (
          <>
            <button
              title="Desbloquear"
              style={{ ...actionBtn, color: '#C9A96E' }}
              onClick={() => onBlock(slot)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LockOpen size={12} />
            </button>
            <button
              title="Editar motivo"
              style={{ ...actionBtn, color: '#7A7268' }}
              onClick={() => onEditSlot(slot)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <PencilSimple size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
