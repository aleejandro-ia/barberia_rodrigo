'use client'

import {
  Plus, Lock, LockOpen, PencilSimple, X, WhatsappLogo,
  ArrowsClockwise, UserMinus, User, CheckCircle, Scissors,
  Phone, EnvelopeSimple, UserCircle,
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

/* Apple-style action button: larger tap target, soft fill, smooth hover */
const actionBtn = (color: string): React.CSSProperties => ({
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  width:           38,
  height:          38,
  borderRadius:    11,
  border:          `1px solid ${color}2e`,
  backgroundColor: `${color}14`,
  color,
  cursor:          'pointer',
  transition:      'transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease',
  flexShrink:      0,
})
const hoverIn  = (color: string) => (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.backgroundColor = `${color}24`
  e.currentTarget.style.borderColor     = `${color}55`
  e.currentTarget.style.transform       = 'translateY(-1px)'
}
const hoverOut = (color: string) => (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.backgroundColor = `${color}14`
  e.currentTarget.style.borderColor     = `${color}2e`
  e.currentTarget.style.transform       = 'translateY(0)'
}

/* Labeled data field with leading icon — premium, scannable */
function Field({
  icon, label, value, valueColor = '#F2EDE7', strike = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
  strike?: boolean
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="mt-0.5 flex-shrink-0" style={{ color: '#6E6457' }}>{icon}</span>
      <div className="min-w-0">
        <p className="uppercase tracking-[0.14em]" style={{ color: '#6E6457', fontSize: '0.62rem', lineHeight: 1.4 }}>
          {label}
        </p>
        <p
          className="font-medium truncate"
          style={{ color: valueColor, fontSize: '0.95rem', lineHeight: 1.35, textDecoration: strike ? 'line-through' : 'none' }}
        >
          {value}
        </p>
      </div>
    </div>
  )
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
    cardBg      = 'rgba(74,222,128,0.05)'
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

  const hasAppt    = isConfirmed || isCancelled || isCancelledByAdmin || isNoShow || isCompleted
  const strikeName = isCancelled || isCancelledByAdmin
  const barberName = appt?.barber_id ? barberMap?.get(appt.barber_id) : undefined

  return (
    <div
      className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-5 rounded-2xl transition-all duration-150 px-4 py-4 md:px-5 md:py-4"
      style={{
        backgroundColor: cardBg,
        backgroundImage: bgImage,
        border:          `1px solid ${borderColor}`,
        borderLeft:      `4px solid ${accentColor}`,
      }}
    >
      {/* ── Left (mobile: top bar): time ───────────────────────── */}
      <div
        className="flex flex-row md:flex-col items-baseline md:items-start md:justify-center gap-2 md:gap-1 flex-shrink-0 pb-3 md:pb-0 md:pr-5 border-b md:border-b-0 md:border-r"
        style={{ minWidth: 76, borderColor }}
      >
        <span className="font-bold tabular-nums leading-none" style={{ color: timeTxt, fontSize: '1.4rem' }}>
          {timeLabel(slot.start_time)}
        </span>
        <span className="tabular-nums" style={{ color: '#5A5450', fontSize: '0.8rem' }}>
          {timeLabel(slot.end_time)}
        </span>
      </div>

      {/* ── Middle: content ────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {isBlocked && (
          <div>
            <p className="font-semibold" style={{ color: '#6E6457', fontSize: '1rem' }}>Bloqueado</p>
            {slot.blocked_reason && (
              <p className="mt-1 truncate" style={{ color: '#4A4540', fontSize: '0.85rem' }}>{slot.blocked_reason}</p>
            )}
          </div>
        )}

        {isFree && (
          <div className="flex items-center gap-2">
            <Scissors size={17} style={{ color: '#5A5450' }} />
            <p className="font-medium" style={{ color: '#6E6457', fontSize: '1rem' }}>Hueco libre</p>
          </div>
        )}

        {hasAppt && appt && (
          <div className="flex flex-col gap-3">
            {/* Name + status */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <p
                className="font-semibold truncate"
                style={{ color: nameTxt, fontSize: '1.15rem', textDecoration: strikeName ? 'line-through' : 'none' }}
              >
                {appt.client_name}
              </p>
              {appt.user_id == null && (
                <span className="px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: 'rgba(201,169,110,0.14)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)', fontSize: '0.7rem' }}>
                  Walk-in
                </span>
              )}
              {statusLabel && (
                <span
                  className="px-2.5 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${statusLabel.color}18`,
                    color:           statusLabel.color,
                    border:          `1px solid ${statusLabel.color}35`,
                    fontSize:        '0.72rem',
                  }}
                >
                  {statusLabel.text}
                </span>
              )}
            </div>

            {/* Data grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              <Field
                icon={<Phone size={15} weight="fill" />}
                label="Teléfono"
                value={appt.client_phone || '—'}
              />
              <Field
                icon={<Scissors size={15} />}
                label="Servicio"
                value={appt.notes?.trim() || 'Sin especificar'}
              />
              <Field
                icon={<UserCircle size={15} weight="fill" />}
                label="Peluquero"
                value={barberName || 'Sin asignar'}
              />
              <Field
                icon={<EnvelopeSimple size={15} />}
                label="Cuenta"
                value={appt.user_id == null ? 'Walk-in · sin cuenta' : (appt.client_email || '—')}
                valueColor={appt.user_id == null ? '#7A7268' : '#F2EDE7'}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Right (mobile: bottom row): action buttons ─────────── */}
      <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 flex-shrink-0 md:self-center w-full md:w-auto md:max-w-[132px]">
        {isFree && (
          <>
            <button title="Crear cita"    style={actionBtn('#C9A96E')} onMouseEnter={hoverIn('#C9A96E')} onMouseLeave={hoverOut('#C9A96E')} onClick={() => onCreateAppointment(slot)}>
              <Plus size={17} weight="bold" />
            </button>
            <button title="Bloquear"      style={actionBtn('#8A8078')} onMouseEnter={hoverIn('#8A8078')} onMouseLeave={hoverOut('#8A8078')} onClick={() => onBlock(slot)}>
              <Lock size={16} />
            </button>
            <button title="Editar horas"  style={actionBtn('#8A8078')} onMouseEnter={hoverIn('#8A8078')} onMouseLeave={hoverOut('#8A8078')} onClick={() => onEditSlot(slot)}>
              <PencilSimple size={16} />
            </button>
          </>
        )}

        {isConfirmed && appt && (
          <>
            <a
              href={buildWhatsAppUrlForSlot(appt, slot.date)}
              target="_blank" rel="noopener noreferrer"
              title="WhatsApp"
              style={{ ...actionBtn('#4ADE80'), textDecoration: 'none' }}
              onMouseEnter={hoverIn('#4ADE80')} onMouseLeave={hoverOut('#4ADE80')}
            >
              <WhatsappLogo size={17} />
            </a>
            {onRescheduleAppointment && (
              <button title="Reagendar" style={actionBtn('#C9A96E')} onMouseEnter={hoverIn('#C9A96E')} onMouseLeave={hoverOut('#C9A96E')} onClick={() => onRescheduleAppointment(appt)}>
                <ArrowsClockwise size={16} />
              </button>
            )}
            {onViewClientHistory && (
              <button title="Ver cliente" style={actionBtn('#8A8078')} onMouseEnter={hoverIn('#8A8078')} onMouseLeave={hoverOut('#8A8078')} onClick={() => onViewClientHistory(appt)}>
                <User size={16} />
              </button>
            )}
            {isPastSlot && onMarkCompleted && (
              <button title="Completada" style={actionBtn('#4ADE80')} onMouseEnter={hoverIn('#4ADE80')} onMouseLeave={hoverOut('#4ADE80')} onClick={() => onMarkCompleted(appt)}>
                <CheckCircle size={16} />
              </button>
            )}
            {onMarkNoShow && (
              <button title="No-show" style={actionBtn('#EF4444')} onMouseEnter={hoverIn('#EF4444')} onMouseLeave={hoverOut('#EF4444')} onClick={() => onMarkNoShow(appt)}>
                <UserMinus size={16} />
              </button>
            )}
            <button title="Editar"   style={actionBtn('#8A8078')} onMouseEnter={hoverIn('#8A8078')} onMouseLeave={hoverOut('#8A8078')} onClick={() => onEditAppointment(appt)}>
              <PencilSimple size={16} />
            </button>
            <button title="Cancelar" style={actionBtn('#FF8080')} onMouseEnter={hoverIn('#FF8080')} onMouseLeave={hoverOut('#FF8080')} onClick={() => onCancelAppointment(appt)}>
              <X size={16} weight="bold" />
            </button>
          </>
        )}

        {isCompleted && appt && (
          <>
            {onViewClientHistory && (
              <button title="Ver cliente" style={actionBtn('#8A8078')} onMouseEnter={hoverIn('#8A8078')} onMouseLeave={hoverOut('#8A8078')} onClick={() => onViewClientHistory(appt)}>
                <User size={16} />
              </button>
            )}
            {onMarkNoShow && (
              <button title="Marcar no-show" style={actionBtn('#EF4444')} onMouseEnter={hoverIn('#EF4444')} onMouseLeave={hoverOut('#EF4444')} onClick={() => onMarkNoShow(appt)}>
                <UserMinus size={16} />
              </button>
            )}
          </>
        )}

        {isNoShow && appt && (
          <>
            {onViewClientHistory && (
              <button title="Ver cliente" style={actionBtn('#8A8078')} onMouseEnter={hoverIn('#8A8078')} onMouseLeave={hoverOut('#8A8078')} onClick={() => onViewClientHistory(appt)}>
                <User size={16} />
              </button>
            )}
            {onMarkCompleted && (
              <button title="Marcar asistida" style={actionBtn('#4ADE80')} onMouseEnter={hoverIn('#4ADE80')} onMouseLeave={hoverOut('#4ADE80')} onClick={() => onMarkCompleted(appt)}>
                <CheckCircle size={16} />
              </button>
            )}
          </>
        )}

        {isBlocked && (
          <>
            <button title="Desbloquear" style={actionBtn('#C9A96E')} onMouseEnter={hoverIn('#C9A96E')} onMouseLeave={hoverOut('#C9A96E')} onClick={() => onBlock(slot)}>
              <LockOpen size={16} />
            </button>
            <button title="Editar motivo" style={actionBtn('#8A8078')} onMouseEnter={hoverIn('#8A8078')} onMouseLeave={hoverOut('#8A8078')} onClick={() => onEditSlot(slot)}>
              <PencilSimple size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
