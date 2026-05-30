'use client'

import { Plus, Lock, LockOpen, PencilSimple, X, WhatsappLogo } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AgendaSlot, AvailabilitySlot, Appointment } from '@/types'

interface AgendaSlotRowProps {
  agendaSlot:            AgendaSlot
  onBlock:               (slot: AvailabilitySlot) => void
  onEditSlot:            (slot: AvailabilitySlot) => void
  onCreateAppointment:   (slot: AvailabilitySlot) => void
  onEditAppointment:     (appointment: Appointment) => void
  onCancelAppointment:   (appointment: Appointment) => void
}

function timeLabel(t: string) {
  return t.slice(0, 5)
}

function buildWhatsAppUrl(appt: Appointment, date: string) {
  const phone = `34${appt.client_phone.replace(/\s/g, '')}`
  const time  = timeLabel(appt.slot_start_time)
  const dateFormatted = format(parseISO(date), "d 'de' MMMM", { locale: es })
  const text  = encodeURIComponent(`Hola ${appt.client_name}, te recuerdo tu cita en BG Barber el ${dateFormatted} a las ${time}.`)
  return `https://wa.me/${phone}?text=${text}`
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
}: AgendaSlotRowProps) {
  const { slot, appointment: appt } = agendaSlot

  const isBlocked   = !slot.is_available
  const isConfirmed = !isBlocked && appt?.status === 'confirmed'
  const isCancelled = !isBlocked && appt?.status === 'cancelled'
  const isFree      = !isBlocked && !appt

  /* ─── Visual state ─────────────────────────────────────────── */
  let rowBg     = 'rgba(201,169,110,0.04)'
  let accentColor = 'rgba(201,169,110,0.4)'
  let bgImage   = 'none'

  if (isBlocked) {
    rowBg     = 'rgba(255,255,255,0.02)'
    accentColor = '#3A3530'
    bgImage   = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 8px)'
  } else if (isConfirmed) {
    rowBg     = 'rgba(74,222,128,0.06)'
    accentColor = '#4ADE80'
  } else if (isCancelled) {
    rowBg     = 'rgba(255,80,80,0.04)'
    accentColor = 'rgba(255,80,80,0.35)'
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150"
      style={{
        backgroundColor: rowBg,
        backgroundImage: bgImage,
        border:          `1px solid ${isBlocked ? 'rgba(255,255,255,0.04)' : isConfirmed ? 'rgba(74,222,128,0.12)' : isCancelled ? 'rgba(255,80,80,0.1)' : 'rgba(201,169,110,0.08)'}`,
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
            color:           isBlocked ? '#4A4540' : isConfirmed ? '#4ADE80' : isCancelled ? 'rgba(255,80,80,0.6)' : '#C9A96E',
            textDecoration:  isCancelled ? 'line-through' : 'none',
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

        {(isConfirmed || isCancelled) && appt && (
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className="text-sm font-medium truncate"
              style={{
                color:          isConfirmed ? '#F2EDE7' : '#5A5450',
                textDecoration: isCancelled ? 'line-through' : 'none',
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
              href={buildWhatsAppUrl(appt, slot.date)}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir WhatsApp"
              style={{ ...actionBtn, color: '#4ADE80', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <WhatsappLogo size={12} />
            </a>
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
