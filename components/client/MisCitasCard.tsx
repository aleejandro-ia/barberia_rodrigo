'use client'

import { useState } from 'react'
import { CalendarBlank, Clock, WhatsappLogo, ArrowCounterClockwise, X } from '@phosphor-icons/react'
import type { Appointment, AppointmentStatus } from '@/types'
import { whatsAppCancelOutOfTime, whatsAppRescheduleOutOfTime } from '@/lib/whatsapp'
import { hoursUntilMadrid } from '@/lib/datetime'
import CancelConfirmModal from './CancelConfirmModal'
import RescheduleModal from './RescheduleModal'
import AddToCalendarButton from './AddToCalendarButton'

interface StatusConfig {
  label: string
  bg: string
  color: string
}

const STATUS_CONFIG: Record<AppointmentStatus, StatusConfig> = {
  confirmed: {
    label: 'Confirmada',
    bg: 'rgba(74,222,128,0.12)',
    color: '#4ADE80',
  },
  cancelled: {
    label: 'Cancelada',
    bg: 'rgba(239,68,68,0.10)',
    color: '#EF4444',
  },
  cancelled_by_client: {
    label: 'Cancelada',
    bg: 'rgba(239,68,68,0.10)',
    color: '#EF4444',
  },
  cancelled_by_admin: {
    label: 'Cancelada por el barbero',
    bg: 'rgba(255,160,50,0.10)',
    color: '#FFA032',
  },
  no_show: {
    label: 'No asististe',
    bg: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
  },
  completed: {
    label: 'Completada ✓',
    bg: 'rgba(255,255,255,0.06)',
    color: '#7A7268',
  },
  rescheduled: {
    label: 'Confirmada',
    bg: 'rgba(74,222,128,0.12)',
    color: '#4ADE80',
  },
}

function canAct(appt: Appointment, hoursRequired: number): boolean {
  return hoursUntilMadrid(appt.slot_date, appt.slot_start_time) >= hoursRequired
}

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function isUpcoming(appt: Appointment): boolean {
  const today = new Date().toISOString().split('T')[0]
  return appt.status === 'confirmed' && appt.slot_date >= today
}

interface MisCitasCardProps {
  appointment: Appointment
  variant?: 'featured' | 'compact'
  whatsappPhone?: string
  whatsappCancelMsg?: string
  whatsappRescheduleMsg?: string
  businessName?: string
  onRefresh: () => void
  cancelHoursBefore?: number
  rescheduleHoursBefore?: number
  barberMap?: Map<string, string>
  barberCount?: number
}

export default function MisCitasCard({
  appointment: initialAppointment,
  variant = 'compact',
  whatsappPhone = '34600000000',
  whatsappCancelMsg = 'Hola, necesito cancelar mi cita.',
  whatsappRescheduleMsg = 'Hola, me gustaría cambiar mi cita.',
  businessName = 'BG Barber',
  onRefresh,
  cancelHoursBefore = 3,
  rescheduleHoursBefore = 3,
  barberMap,
  barberCount = 0,
}: MisCitasCardProps) {
  // Use the prop directly — freezing it in useState made the card show
  // stale data (old date/time) after a reschedule, since the same card
  // instance persists across the parent refetch.
  const appointment = initialAppointment
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)

  const upcoming = isUpcoming(appointment)
  const isPastConfirmed = appointment.status === 'confirmed' && !upcoming
  const statusCfg = isPastConfirmed
    ? { label: 'Pasada', bg: 'rgba(255,255,255,0.05)', color: '#7A7268' }
    : STATUS_CONFIG[appointment.status]
  const canCancel     = upcoming && canAct(appointment, cancelHoursBefore)
  const canReschedule = upcoming && canAct(appointment, rescheduleHoursBefore)
  const showWhatsAppCancel = upcoming && !canCancel
  const showWhatsAppReschedule = upcoming && !canReschedule

  return (
    <>
      <div
        className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200"
        style={{
          backgroundColor: '#161310',
          border: '1px solid rgba(201,169,110,0.15)',
          ...(variant === 'featured' ? { padding: '20px' } : {}),
        }}
      >
        {/* Header: date + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <CalendarBlank size={14} weight="bold" style={{ color: '#C9A96E' }} />
              <p
                className="text-sm font-medium capitalize"
                style={{ color: '#F2EDE7' }}
              >
                {formatDate(appointment.slot_date)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} weight="bold" style={{ color: '#7A7268' }} />
              <p className="text-sm" style={{ color: '#7A7268' }}>
                {appointment.slot_start_time.slice(0, 5)} — {appointment.slot_end_time.slice(0, 5)}
              </p>
            </div>
            {barberCount >= 2 && appointment.barber_id && barberMap?.get(appointment.barber_id) && (
              <span style={{ fontSize: '0.75rem', color: '#5A5450' }}>
                ✂ {barberMap.get(appointment.barber_id)}
              </span>
            )}
          </div>

          {/* Status badge */}
          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: statusCfg.bg,
              color: statusCfg.color,
            }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Service / notes */}
        {appointment.notes && (
          <p className="text-sm" style={{ color: '#7A7268' }}>
            {appointment.notes}
          </p>
        )}

        {/* Actions — only for upcoming confirmed */}
        {upcoming && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Add to calendar */}
            <AddToCalendarButton appointment={appointment} businessName={businessName} />

            {/* Cancel */}
            {canCancel ? (
              <button
                onClick={() => setCancelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: '#EF4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                  backgroundColor: 'rgba(239,68,68,0.06)',
                }}
              >
                <X size={13} weight="bold" />
                Cancelar
              </button>
            ) : showWhatsAppCancel ? (
              <a
                href={whatsAppCancelOutOfTime(whatsappPhone, whatsappCancelMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: '#7A7268',
                  border: '1px solid rgba(122,114,104,0.2)',
                  backgroundColor: 'transparent',
                }}
              >
                <WhatsappLogo size={13} weight="bold" />
                Cancelar vía WhatsApp
              </a>
            ) : null}

            {/* Reschedule */}
            {canReschedule ? (
              <button
                onClick={() => setRescheduleOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: '#C9A96E',
                  border: '1px solid rgba(201,169,110,0.25)',
                  backgroundColor: 'rgba(201,169,110,0.06)',
                }}
              >
                <ArrowCounterClockwise size={13} weight="bold" />
                Reagendar
              </button>
            ) : showWhatsAppReschedule ? (
              <a
                href={whatsAppRescheduleOutOfTime(whatsappPhone, whatsappRescheduleMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: '#7A7268',
                  border: '1px solid rgba(122,114,104,0.2)',
                  backgroundColor: 'transparent',
                }}
              >
                <WhatsappLogo size={13} weight="bold" />
                Reagendar vía WhatsApp
              </a>
            ) : null}
          </div>
        )}
      </div>

      {/* Modals */}
      <CancelConfirmModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={appointment}
        onSuccess={onRefresh}
      />
      <RescheduleModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={appointment}
        onSuccess={onRefresh}
      />
    </>
  )
}
