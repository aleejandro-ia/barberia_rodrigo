'use client'

import {
  Plus, Lock, LockOpen, PencilSimple, X, WhatsappLogo,
  ArrowsClockwise, UserMinus, User, CheckCircle, Scissors,
} from '@phosphor-icons/react'
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

function timeLabel(t: string) { return t.slice(0, 5) }

function buildWhatsAppUrlForSlot(appt: Appointment, date: string) {
  const time          = timeLabel(appt.slot_start_time)
  const dateFormatted = format(parseISO(date), "d 'de' MMMM", { locale: es })
  return whatsAppReminder(appt.client_phone, appt.client_name, dateFormatted, time)
}

const actionBtn = (color: string, hoverBg: string): React.CSSProperties => ({
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  width:           30,
  height:          30,
  borderRadius:    8,
  border:          `1px solid ${color}30`,
  backgroundColor: `${color}10`,
  color,
  cursor:          'pointer',
  transition:      'background-color 0.12s',
  flexShrink:      0,
})

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

  const isBlocked          = !slot.is_available
  const isConfirmed        = !isBlocked && appt?.status === 'confirmed'
  const isCancelled        = !isBlocked && (appt?.status === 'cancelled' || appt?.status === 'cancelled_by_client')
  const isCancelledByAdmin = !isBlocked && appt?.status === 'cancelled_by_admin'
  const isNoShow           = !isBlocked && appt?.status === 'no_show'
  const isCompleted        = !isBlocked && appt?.status === 'completed'
  const isFree             = !isBlocked && !appt

  const isPastSlot = isBefore(startOfDay(parseISO(slot.date)), startOfDay(new Date()))

  /* ─── Visual state ──────────────────────────────────────────── */
  let cardBg      = 'rgba(201,169,110,0.04)'
  let accentColor = '#C9A96E'
  let bgImage     = 'none'
  let borderColor = 'rgba(201,169,110,0.12)'
  let timeTxt     = '#C9A96E'
  let nameTxt     = '#F2EDE7'
  let statusLabel: { text: string; color: string } | null = null

  if (isBlocked) {
    cardBg      = 'rgba(255,255,255,0.02)'
    accentColor = '#3A3530'
    borderColor = 'rgba(255,255,255,0.05)'
    bgImage     = 'repeating-linear-gradient(135deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 8px)'
    timeTxt     = '#4A4540'
  } else if (isConfirmed) {
    cardBg      = 'rgba(74,222,128,0.06)'
    accentColor = '#4ADE80'
    borderColor = 'rgba(74,222,128,0.15)'
    timeTxt     = '#4ADE80'
  } else if (isCancelled) {
    cardBg      = 'rgba(255,80,80,0.04)'
    accentColor = 'rgba(255,80,80,0.4)'
    borderColor = 'rgba(255,80,80,0.1)'
    timeTxt     = 'rgba(255,80,80,0.55)'
    nameTxt     = '#5A5450'
    statusLabel = { text: 'Cancelada', color: '#FF5050' }
  } else if (isCancelledByAdmin) {
    cardBg      = 'rgba(255,160,50,0.06)'
    accentColor = '#FFA032'
    borderColor = 'rgba(255,160,50,0.15)'
    timeTxt     = '#FFA032'
    nameTxt     = '#7A7268'
    statusLabel = { text: 'Cancelada por barbero', color: '#FFA032' }
  } else if (isNoShow) {
    cardBg      = 'rgba(239,68,68,0.1)'
    accentColor = '#EF4444'
    borderColor = 'rgba(239,68,68,0.2)'
    timeTxt     = '#EF4444'
    nameTxt     = '#7A7268'
    statusLabel = { text: 'No-show', color: '#EF4444' }
  } else if (isCompleted) {
    cardBg      = 'rgba(255,255,255,0.03)'
    accentColor = '#3A3530'
    borderColor = 'rgba(255,255,255,0.06)'
    timeTxt     = '#4A4540'
    nameTxt     = '#7A7268'
    statusLabel = { text: '✓ Completada', color: '#4ADE80' }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl overflow-hidden transition-all duration-150 px-3 py-2.5"
      style={{
        backgroundColor: cardBg,
        backgroundImage: bgImage,
        border:          `1px solid ${borderColor}`,
        borderLeft:      `3px solid ${accentColor}`,
      }}
    >
      {/* ── Left: time ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 64 }}>
        <span className="text-sm font-bold tabular-nums leading-tight" style={{ color: timeTxt }}>
          {timeLabel(slot.start_time)}
        </span>
        <span className="text-xs tabular-nums leading-tight" style={{ color: '#3A3530' }}>
          {timeLabel(slot.end_time)}
        </span>
      </div>

      {/* ── Middle: content ────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {isBlocked && (
          <div>
            <p className="text-sm font-semibold" style={{ color: '#4A4540' }}>Bloqueado</p>
            {slot.blocked_reason && (
              <p className="text-xs mt-0.5 truncate" style={{ color: '#3A3530' }}>{slot.blocked_reason}</p>
            )}
          </div>
        )}

        {isFree && (
          <div className="flex items-center gap-1.5">
            <Scissors size={12} style={{ color: '#3A3530' }} />
            <p className="text-sm" style={{ color: '#3A3530' }}>Hueco libre</p>
          </div>
        )}

        {(isConfirmed || isCancelled || isCancelledByAdmin || isNoShow || isCompleted) && appt && (
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-semibold truncate"
              style={{
                color:          nameTxt,
                textDecoration: (isCancelled || isCancelledByAdmin) ? 'line-through' : 'none',
              }}
            >
              {appt.client_name}
            </p>
            <p className="text-xs" style={{ color: '#4A4540' }}>{appt.client_phone}</p>
            {appt.notes && (
              <p className="text-xs truncate" style={{ color: '#3A3530' }}>
                {appt.notes}
              </p>
            )}
            {appt.user_id == null && (
              <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.2)' }}>
                Walk-in
              </span>
            )}
            {barberCount >= 2 && appt.barber_id && barberMap?.get(appt.barber_id) && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(201,169,110,0.1)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.2)' }}>
                {barberMap.get(appt.barber_id)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Right: status badge + action buttons ───────────────── */}
      {statusLabel && (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
          style={{
            backgroundColor: `${statusLabel.color}15`,
            color:           statusLabel.color,
            border:          `1px solid ${statusLabel.color}30`,
          }}
        >
          {statusLabel.text}
        </span>
      )}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isFree && (
          <>
            <button title="Crear cita"    style={actionBtn('#C9A96E', 'rgba(201,169,110,0.15)')} onClick={() => onCreateAppointment(slot)}>
              <Plus size={13} weight="bold" />
            </button>
            <button title="Bloquear"     style={actionBtn('#7A7268', 'rgba(255,255,255,0.07)')} onClick={() => onBlock(slot)}>
              <Lock size={13} />
            </button>
            <button title="Editar horas" style={actionBtn('#7A7268', 'rgba(255,255,255,0.07)')} onClick={() => onEditSlot(slot)}>
              <PencilSimple size={13} />
            </button>
          </>
        )}

        {isConfirmed && appt && (
          <>
            <a
              href={buildWhatsAppUrlForSlot(appt, slot.date)}
              target="_blank" rel="noopener noreferrer"
              title="WhatsApp"
              style={{ ...actionBtn('#4ADE80', 'rgba(74,222,128,0.1)'), textDecoration: 'none' }}
            >
              <WhatsappLogo size={13} />
            </a>
            {onRescheduleAppointment && (
              <button title="Reagendar" style={actionBtn('#C9A96E', 'rgba(201,169,110,0.1)')} onClick={() => onRescheduleAppointment(appt)}>
                <ArrowsClockwise size={13} />
              </button>
            )}
            {onViewClientHistory && (
              <button title="Ver cliente" style={actionBtn('#7A7268', 'rgba(255,255,255,0.07)')} onClick={() => onViewClientHistory(appt)}>
                <User size={13} />
              </button>
            )}
            {isPastSlot && onMarkCompleted && (
              <button title="Completada" style={actionBtn('#4ADE80', 'rgba(74,222,128,0.1)')} onClick={() => onMarkCompleted(appt)}>
                <CheckCircle size={13} />
              </button>
            )}
            {onMarkNoShow && (
              <button title="No-show" style={actionBtn('#EF4444', 'rgba(239,68,68,0.1)')} onClick={() => onMarkNoShow(appt)}>
                <UserMinus size={13} />
              </button>
            )}
            <button title="Editar"   style={actionBtn('#7A7268', 'rgba(255,255,255,0.07)')} onClick={() => onEditAppointment(appt)}>
              <PencilSimple size={13} />
            </button>
            <button title="Cancelar" style={actionBtn('#FF8080', 'rgba(255,80,80,0.1)')}  onClick={() => onCancelAppointment(appt)}>
              <X size={13} weight="bold" />
            </button>
          </>
        )}

        {isBlocked && (
          <>
            <button title="Desbloquear" style={actionBtn('#C9A96E', 'rgba(201,169,110,0.1)')} onClick={() => onBlock(slot)}>
              <LockOpen size={13} />
            </button>
            <button title="Editar motivo" style={actionBtn('#7A7268', 'rgba(255,255,255,0.07)')} onClick={() => onEditSlot(slot)}>
              <PencilSimple size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
