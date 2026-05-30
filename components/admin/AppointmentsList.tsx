'use client'

import { useState } from 'react'
import { adminCancelAppointment } from '@/actions/appointments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Appointment } from '@/types'

interface Props {
  appointments: Appointment[]
  onRefresh: () => void
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function groupByDate(appointments: Appointment[]) {
  const groups: Record<string, Appointment[]> = {}
  for (const appt of appointments) {
    if (!groups[appt.slot_date]) groups[appt.slot_date] = []
    groups[appt.slot_date].push(appt)
  }
  return groups
}

export default function AppointmentsList({ appointments, onRefresh }: Props) {
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (appointments.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 rounded-2xl"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.08)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: '#C9A96E' }}>
            <rect x="2" y="3" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.5" />
            <line x1="6" y1="1" x2="6" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="1" x2="14" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: '#7A7268' }}>
          No hay citas en este período
        </p>
      </div>
    )
  }

  const grouped = groupByDate(appointments)
  const sortedDates = Object.keys(grouped).sort()

  async function handleCancel() {
    if (!cancelTarget) return
    setLoading(true)
    setError(null)
    try {
      const result = await adminCancelAppointment(cancelTarget.id)
      if ('error' in result) {
        setError(
          result.error === 'ALREADY_CANCELLED'
            ? 'Ya estaba cancelada.'
            : 'Error al cancelar.',
        )
      } else {
        setCancelTarget(null)
        onRefresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date label */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#C9A96E' }} />
              <h3
                className="text-xs font-semibold uppercase tracking-widest capitalize"
                style={{ color: '#7A7268' }}
              >
                {formatDate(date)}
              </h3>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,169,110,0.06)' }} />
              <span className="text-xs" style={{ color: '#4A4540' }}>
                {grouped[date].length} cita{grouped[date].length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Appointment cards */}
            <div className="flex flex-col gap-2">
              {grouped[date].map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl transition-colors"
                  style={{
                    backgroundColor: '#161310',
                    border: '1px solid rgba(201,169,110,0.08)',
                    opacity: appt.status === 'cancelled' ? 0.5 : 1,
                  }}
                >
                  {/* Time */}
                  <div
                    className="text-sm font-semibold tabular-nums whitespace-nowrap w-20 flex-shrink-0"
                    style={{ color: '#C9A96E' }}
                  >
                    {appt.slot_start_time.slice(0, 5)}
                  </div>

                  {/* Client info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F2EDE7' }}>
                      {appt.client_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#7A7268' }}>
                      {appt.client_phone}
                      {appt.notes && (
                        <span> · <span style={{ color: '#5A5450' }}>{appt.notes}</span></span>
                      )}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div
                    className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                    style={
                      appt.status === 'confirmed'
                        ? {
                            backgroundColor: 'rgba(74,222,128,0.1)',
                            border: '1px solid rgba(74,222,128,0.2)',
                            color: '#4ADE80',
                          }
                        : {
                            backgroundColor: 'rgba(255,128,128,0.1)',
                            border: '1px solid rgba(255,128,128,0.2)',
                            color: '#FF8080',
                          }
                    }
                  >
                    {appt.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                  </div>

                  {/* Cancel action */}
                  {appt.status === 'confirmed' && (
                    <button
                      onClick={() => setCancelTarget(appt)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full transition-all flex-shrink-0"
                      style={{
                        color: '#7A7268',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FF8080'
                        e.currentTarget.style.borderColor = 'rgba(255,128,128,0.3)'
                        e.currentTarget.style.backgroundColor = 'rgba(255,128,128,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#7A7268'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null)
            setError(null)
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
            <DialogDescription>
              ¿Cancelar la cita de{' '}
              <strong className="text-zinc-200">{cancelTarget?.client_name}</strong>
              {' '}el {cancelTarget ? formatDate(cancelTarget.slot_date) : ''} a las{' '}
              {cancelTarget?.slot_start_time.slice(0, 5)}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p
              className="text-sm px-3 py-2 rounded-lg"
              style={{ color: '#FF8080', backgroundColor: 'rgba(255,128,128,0.08)' }}
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <button
              onClick={() => { setCancelTarget(null); setError(null) }}
              disabled={loading}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Volver
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ backgroundColor: 'rgba(255,80,80,0.15)', color: '#FF8080', border: '1px solid rgba(255,80,80,0.25)' }}
            >
              {loading ? 'Cancelando…' : 'Sí, cancelar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
