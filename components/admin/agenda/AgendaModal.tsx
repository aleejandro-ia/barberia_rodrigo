'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  adminCreateAppointment,
  adminEditAppointment,
  adminToggleSlotBlock,
  adminEditSlotTimes,
  adminRescheduleAppointment,
  adminMarkNoShow,
  adminMarkCompleted,
} from '@/actions/agenda'
import { adminCancelAppointment } from '@/actions/appointments'
import SlotBulkCreator from '@/components/admin/SlotBulkCreator'
import BookingCalendar from '@/components/landing/BookingCalendar'
import TimeSlotPicker from '@/components/landing/TimeSlotPicker'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AvailabilitySlot, Appointment, Barber } from '@/types'

/* ─── Modal mode union ───────────────────────────────────────── */
export type AgendaModalMode =
  | { type: 'closed' }
  | { type: 'create-appointment';   slot: AvailabilitySlot }
  | { type: 'edit-appointment';     appointment: Appointment }
  | { type: 'cancel-appointment';   appointment: Appointment }
  | { type: 'block-slot';           slot: AvailabilitySlot }
  | { type: 'edit-slot-times';      slot: AvailabilitySlot }
  | { type: 'bulk-creator';         date: string }
  | { type: 'reschedule-appointment'; appointment: Appointment }
  | { type: 'mark-no-show';           appointment: Appointment }
  | { type: 'mark-completed';         appointment: Appointment }
  | { type: 'client-history';         appointment: Appointment }

interface AgendaModalProps {
  mode:      AgendaModalMode
  onClose:   () => void
  onSuccess: () => void
  barberId?: string
}

/* ─── Shared input style ─────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border:          '1px solid rgba(201,169,110,0.2)',
  color:           '#F2EDE7',
  borderRadius:    '0.75rem',
  padding:         '0.65rem 0.875rem',
  fontSize:        '0.875rem',
  outline:         'none',
  width:           '100%',
  transition:      'border-color 0.15s',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium block mb-1.5" style={{ color: '#7A7268' }}>
      {children}
    </label>
  )
}

function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <p className="text-xs px-3 py-2 rounded-xl mt-2"
      style={{ color: '#FF8080', backgroundColor: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.2)' }}>
      {msg}
    </p>
  )
}

function ActionRow({ onClose, onSubmit, loading, danger = false, submitLabel }: {
  onClose: () => void
  onSubmit: () => void
  loading: boolean
  danger?: boolean
  submitLabel: string
}) {
  return (
    <div className="flex gap-2 mt-5">
      <button
        onClick={onClose}
        className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
        style={{ border: '1px solid rgba(201,169,110,0.15)', color: '#7A7268', cursor: 'pointer', background: 'none' }}
      >
        Cancelar
      </button>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
        style={{
          backgroundColor: loading ? 'rgba(201,169,110,0.15)' : danger ? '#FF8080' : '#C9A96E',
          color:           loading ? '#4A4540' : danger ? '#0E0B08' : '#0E0B08',
          cursor:          loading ? 'not-allowed' : 'pointer',
          border:          'none',
        }}
      >
        {loading ? 'Guardando…' : submitLabel}
      </button>
    </div>
  )
}

/* ─── Form: Create appointment ───────────────────────────────── */
function CreateAppointmentForm({ slot, onClose, onSuccess }: {
  slot:      AvailabilitySlot
  onClose:   () => void
  onSuccess: () => void
}) {
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const slotLabel = `${slot.date} · ${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`

  async function handleSubmit() {
    if (name.trim().length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return }
    if (phone.replace(/\s/g, '').length !== 9) { setError('Teléfono: 9 dígitos sin prefijo.'); return }
    setLoading(true); setError(null)
    const result = await adminCreateAppointment({
      slot_date:       slot.date,
      slot_start_time: slot.start_time.slice(0, 5),
      slot_end_time:   slot.end_time.slice(0, 5),
      barber_id:       slot.barber_id ?? undefined,
      client_name:     name.trim(),
      client_phone:    phone,
      notes:           notes.trim() || undefined,
    })
    setLoading(false)
    if ('error' in result) {
      const msgs: Record<string, string> = {
        SLOT_TAKEN: 'Este hueco ya tiene una cita.', SLOT_NOT_FOUND: 'El hueco no está disponible.',
        UNAUTHORIZED: 'Sin permisos.', VALIDATION_ERROR: 'Revisa los datos.',
      }
      setError(msgs[result.error] ?? 'Error desconocido.')
    } else {
      onSuccess()
    }
  }

  return (
    <div>
      <p className="text-xs mb-4 px-2 py-1.5 rounded-lg" style={{ color: '#C9A96E', backgroundColor: 'rgba(201,169,110,0.08)' }}>
        {slotLabel}
      </p>
      <div className="flex flex-col gap-3">
        <div><Label>Nombre</Label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente"
            maxLength={100} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
        </div>
        <div><Label>Teléfono</Label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 123 456"
            maxLength={20} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
          <p className="text-xs mt-1" style={{ color: '#3A3530' }}>9 dígitos sin prefijo</p>
        </div>
        <div><Label>Notas (opcional)</Label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Servicio, preferencias…"
            maxLength={500} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
        </div>
      </div>
      <ErrorMsg msg={error} />
      <ActionRow onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Crear cita" />
    </div>
  )
}

/* ─── Form: Edit appointment ─────────────────────────────────── */
function EditAppointmentForm({ appointment: appt, onClose, onSuccess }: {
  appointment: Appointment
  onClose:     () => void
  onSuccess:   () => void
}) {
  const [name,    setName]    = useState(appt.client_name)
  const [phone,   setPhone]   = useState(appt.client_phone)
  const [notes,   setNotes]   = useState(appt.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit() {
    if (name.trim().length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return }
    if (phone.replace(/\s/g, '').length !== 9) { setError('Teléfono: 9 dígitos sin prefijo.'); return }
    setLoading(true); setError(null)
    const result = await adminEditAppointment(appt.id, {
      client_name: name.trim(), client_phone: phone, notes: notes.trim() || undefined,
    })
    setLoading(false)
    if ('error' in result) setError('Error al guardar. Inténtalo de nuevo.')
    else onSuccess()
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div><Label>Nombre</Label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
        </div>
        <div><Label>Teléfono</Label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
        </div>
        <div><Label>Notas</Label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
        </div>
      </div>
      <ErrorMsg msg={error} />
      <ActionRow onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Guardar cambios" />
    </div>
  )
}

/* ─── Form: Cancel appointment ───────────────────────────────── */
function CancelAppointmentForm({ appointment: appt, onClose, onSuccess }: {
  appointment: Appointment
  onClose:     () => void
  onSuccess:   () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true); setError(null)
    const result = await adminCancelAppointment(appt.id)
    setLoading(false)
    if ('error' in result) setError('Error al cancelar.')
    else onSuccess()
  }

  const dateLabel = format(parseISO(appt.slot_date), "d 'de' MMMM, yyyy", { locale: es })
  const time      = appt.slot_start_time.slice(0, 5)

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: '#7A7268' }}>
        ¿Cancelar la cita de <strong style={{ color: '#F2EDE7' }}>{appt.client_name}</strong> el{' '}
        <strong style={{ color: '#F2EDE7' }}>{dateLabel}</strong> a las{' '}
        <strong style={{ color: '#F2EDE7' }}>{time}</strong>?
      </p>
      <p className="text-xs" style={{ color: '#4A4540' }}>
        El hueco volverá a estar disponible para nuevas reservas.
      </p>
      <ErrorMsg msg={error} />
      <ActionRow onClose={onClose} onSubmit={handleSubmit} loading={loading} danger submitLabel="Cancelar cita" />
    </div>
  )
}

/* ─── Form: Block/unblock slot ───────────────────────────────── */
function BlockSlotForm({ slot, onClose, onSuccess }: {
  slot:      AvailabilitySlot
  onClose:   () => void
  onSuccess: () => void
}) {
  const isCurrentlyBlocked = !slot.is_available
  const [reason,  setReason]  = useState(slot.blocked_reason ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // If currently blocked → action is unblock. If free → action is block.
  const willBlock = !isCurrentlyBlocked

  async function handleSubmit() {
    setLoading(true); setError(null)
    const result = await adminToggleSlotBlock(slot.id, willBlock, willBlock ? reason : undefined)
    setLoading(false)
    if ('error' in result) {
      const msgs: Record<string, string> = {
        HAS_BOOKING:  'No se puede bloquear: hay una cita confirmada en este hueco.',
        NOT_FOUND:    'Hueco no encontrado.',
        UNAUTHORIZED: 'Sin permisos.',
      }
      setError(msgs[result.error] ?? 'Error desconocido.')
    } else {
      onSuccess()
    }
  }

  const slotLabel = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`

  return (
    <div>
      <p className="text-xs mb-4 px-2 py-1.5 rounded-lg" style={{ color: '#C9A96E', backgroundColor: 'rgba(201,169,110,0.08)' }}>
        {slotLabel}
      </p>
      {isCurrentlyBlocked ? (
        <p className="text-sm mb-4" style={{ color: '#7A7268' }}>
          Desbloquear este hueco para que vuelva a estar disponible para reservas.
          {slot.blocked_reason && (
            <span style={{ color: '#4A4540' }}> Motivo actual: {slot.blocked_reason}</span>
          )}
        </p>
      ) : (
        <div>
          <p className="text-sm mb-4" style={{ color: '#7A7268' }}>
            Bloquear este hueco para que no aparezca como disponible.
          </p>
          <div>
            <Label>Motivo (opcional)</Label>
            <input
              type="text" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="ej. Descanso, evento personal…" maxLength={200} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
            />
          </div>
        </div>
      )}
      <ErrorMsg msg={error} />
      <ActionRow
        onClose={onClose} onSubmit={handleSubmit} loading={loading}
        danger={false}
        submitLabel={isCurrentlyBlocked ? 'Desbloquear' : 'Bloquear hueco'}
      />
    </div>
  )
}

/* ─── Form: Edit slot times ──────────────────────────────────── */
function EditSlotTimesForm({ slot, onClose, onSuccess }: {
  slot:      AvailabilitySlot
  onClose:   () => void
  onSuccess: () => void
}) {
  const [start,   setStart]   = useState(slot.start_time.slice(0, 5))
  const [end,     setEnd]     = useState(slot.end_time.slice(0, 5))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit() {
    if (start >= end) { setError('La hora de fin debe ser posterior a la de inicio.'); return }
    setLoading(true); setError(null)
    const result = await adminEditSlotTimes(slot.id, { start_time: start, end_time: end })
    setLoading(false)
    if ('error' in result) {
      const msgs: Record<string, string> = {
        HAS_BOOKING:    'No se puede editar: hay una cita confirmada.',
        DUPLICATE_SLOT: 'Ya existe un hueco con esa hora de inicio.',
        VALIDATION_ERROR: 'Hora de inicio o fin inválida.',
        NOT_FOUND:      'Hueco no encontrado.',
        UNAUTHORIZED:   'Sin permisos.',
      }
      setError(msgs[result.error] ?? 'Error desconocido.')
    } else {
      onSuccess()
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Hora inicio</Label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
        </div>
        <div>
          <Label>Hora fin</Label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')} />
        </div>
      </div>
      <ErrorMsg msg={error} />
      <ActionRow onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Guardar horas" />
    </div>
  )
}

/* ─── Form: Reschedule appointment ──────────────────────────── */
interface RescheduleSlot { id: string; start_time: string; end_time: string }

function RescheduleAppointmentForm({ appointment: appt, onClose, onSuccess }: {
  appointment: Appointment
  onClose:     () => void
  onSuccess:   () => void
}) {
  const [step,            setStep]            = useState<'date' | 'slot' | 'confirm'>('date')
  const [selectedDate,    setSelectedDate]    = useState<string | null>(null)
  const [selectedSlot,    setSelectedSlot]    = useState<RescheduleSlot | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [barbers,         setBarbers]         = useState<Barber[]>([])
  const [targetBarberId,  setTargetBarberId]  = useState<string>(appt.barber_id ?? '')

  // Load barbers once
  useEffect(() => {
    fetch('/api/barbers')
      .then(r => r.json())
      .then(data => {
        const list: Barber[] = data.barbers ?? []
        setBarbers(list)
        // If appointment has no barber_id but list has one, default to first
        if (!targetBarberId && list.length > 0) setTargetBarberId(list[0].id)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleBarberChange(id: string) {
    if (id === targetBarberId) return
    setTargetBarberId(id)
    setSelectedDate(null)
    setSelectedSlot(null)
    setStep('date')
  }

  function handleDateSelect(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('slot')
  }

  function handleSlotSelect(slot: RescheduleSlot) {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot) return
    setLoading(true); setError(null)
    const result = await adminRescheduleAppointment(appt.id, {
      slot_date:       selectedDate,
      slot_start_time: selectedSlot.start_time.slice(0, 5),
      slot_end_time:   selectedSlot.end_time.slice(0, 5),
      barber_id:       targetBarberId || undefined,
    })
    setLoading(false)
    if ('error' in result) {
      const msgs: Record<string, string> = {
        NOT_FOUND:     'Cita no encontrada.',
        NOT_CONFIRMED: 'Solo se pueden reagendar citas confirmadas.',
        SLOT_TAKEN:    'Ese hueco ya está ocupado.',
        UNAUTHORIZED:  'Sin permisos.',
      }
      setError(msgs[result.error] ?? 'Error desconocido.')
    } else {
      onSuccess()
    }
  }

  const multiBarber = barbers.length > 1

  return (
    <div>
      {/* Current appointment info */}
      <p className="text-xs mb-3" style={{ color: '#7A7268' }}>
        Cita actual: <strong style={{ color: '#F2EDE7' }}>{appt.client_name}</strong>
        {' · '}{appt.slot_date} {appt.slot_start_time.slice(0, 5)}
      </p>

      {/* Barber selector — always visible when 2+ barbers */}
      {multiBarber && (
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl flex-wrap"
          style={{ backgroundColor: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.12)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: '#4A4540' }}>
            Barbero
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {barbers.map(b => (
              <button
                key={b.id}
                onClick={() => handleBarberChange(b.id)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: targetBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.08)',
                  color:           targetBarberId === b.id ? '#0E0B08' : '#7A7268',
                  border:          `1px solid ${targetBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.15)'}`,
                  cursor:          'pointer',
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'date' && (
        <BookingCalendar
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          barberId={targetBarberId || undefined}
        />
      )}

      {step === 'slot' && selectedDate && (
        <div>
          <button
            className="text-xs mb-4 flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: '#C9A96E', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setStep('date')}
          >
            ← Cambiar fecha
          </button>
          <TimeSlotPicker
            date={selectedDate}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSlotSelect}
            barberId={targetBarberId || undefined}
            minHoursAdvance={0}
          />
        </div>
      )}

      {step === 'confirm' && selectedDate && selectedSlot && (
        <div>
          <div
            className="rounded-xl p-3 mb-4"
            style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.12)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#7A7268' }}>
              Nuevo horario
            </p>
            <p className="text-sm font-semibold" style={{ color: '#F2EDE7' }}>
              {format(parseISO(selectedDate), "d 'de' MMMM", { locale: es })} · {selectedSlot.start_time.slice(0, 5)}
            </p>
            {multiBarber && targetBarberId && (
              <p className="text-xs mt-1" style={{ color: '#C9A96E' }}>
                {barbers.find(b => b.id === targetBarberId)?.name ?? ''}
              </p>
            )}
          </div>
          <button
            className="text-xs mb-4 flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: '#7A7268', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setStep('slot')}
          >
            ← Cambiar hora
          </button>
          <ErrorMsg msg={error} />
          <ActionRow onClose={onClose} onSubmit={handleConfirm} loading={loading} submitLabel="Confirmar cambio" />
        </div>
      )}
    </div>
  )
}

/* ─── Form: Mark no-show ─────────────────────────────────────── */
function MarkNoShowForm({ appointment: appt, onClose, onSuccess }: {
  appointment: Appointment
  onClose:     () => void
  onSuccess:   () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true); setError(null)
    const result = await adminMarkNoShow(appt.id)
    setLoading(false)
    if ('error' in result) setError('Error al marcar no-show.')
    else onSuccess()
  }

  const dateLabel = format(parseISO(appt.slot_date), "d 'de' MMMM, yyyy", { locale: es })
  const time      = appt.slot_start_time.slice(0, 5)

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: '#7A7268' }}>
        Marcar como <strong style={{ color: '#EF4444' }}>no-show</strong> la cita de{' '}
        <strong style={{ color: '#F2EDE7' }}>{appt.client_name}</strong> el{' '}
        <strong style={{ color: '#F2EDE7' }}>{dateLabel}</strong> a las{' '}
        <strong style={{ color: '#F2EDE7' }}>{time}</strong>.
      </p>
      <p className="text-xs" style={{ color: '#4A4540' }}>
        El cliente no se presentó. El hueco no volverá a estar disponible.
      </p>
      <ErrorMsg msg={error} />
      <ActionRow onClose={onClose} onSubmit={handleSubmit} loading={loading} danger submitLabel="Marcar no-show" />
    </div>
  )
}

/* ─── Form: Mark completed ───────────────────────────────────── */
function MarkCompletedForm({ appointment: appt, onClose, onSuccess }: {
  appointment: Appointment
  onClose:     () => void
  onSuccess:   () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true); setError(null)
    const result = await adminMarkCompleted(appt.id)
    setLoading(false)
    if ('error' in result) setError('Error al marcar como completada.')
    else onSuccess()
  }

  const dateLabel = format(parseISO(appt.slot_date), "d 'de' MMMM, yyyy", { locale: es })
  const time      = appt.slot_start_time.slice(0, 5)

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: '#7A7268' }}>
        Marcar como <strong style={{ color: '#4ADE80' }}>completada</strong> la cita de{' '}
        <strong style={{ color: '#F2EDE7' }}>{appt.client_name}</strong> el{' '}
        <strong style={{ color: '#F2EDE7' }}>{dateLabel}</strong> a las{' '}
        <strong style={{ color: '#F2EDE7' }}>{time}</strong>.
      </p>
      <ErrorMsg msg={error} />
      <ActionRow onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Marcar completada" />
    </div>
  )
}

/* ─── Panel: Client history ──────────────────────────────────── */
interface ClientHistoryAppt {
  id: string
  slot_date: string
  slot_start_time: string
  client_name: string
  status: string
  notes?: string | null
}
interface ClientHistoryStats {
  total: number
  completed: number
  cancelled: number
  noShow: number
  lastVisit: string | null
}

function ClientHistoryPanel({ appointment: appt, onClose }: {
  appointment: Appointment
  onClose:     () => void
}) {
  const [appointments, setAppointments] = useState<ClientHistoryAppt[]>([])
  const [stats,        setStats]        = useState<ClientHistoryStats | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState(false)

  useEffect(() => {
    fetch(`/api/admin/client-history?phone=${encodeURIComponent(appt.client_phone)}`)
      .then(r => r.json())
      .then(data => {
        setAppointments(data.appointments ?? [])
        setStats(data.stats ?? null)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [appt.client_phone])

  const statusLabel: Record<string, { label: string; color: string }> = {
    confirmed:          { label: 'Confirmada', color: '#4ADE80' },
    completed:          { label: 'Completada', color: '#4ADE80' },
    cancelled:          { label: 'Cancelada',  color: '#FF8080' },
    cancelled_by_client:{ label: 'Cancelada (cliente)', color: '#FF8080' },
    cancelled_by_admin: { label: 'Cancelada (barbero)', color: '#FFA032' },
    no_show:            { label: 'No-show',    color: '#EF4444' },
    rescheduled:        { label: 'Reagendada', color: '#C9A96E' },
  }

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: '#7A7268' }}>
        Historial de <strong style={{ color: '#F2EDE7' }}>{appt.client_name}</strong>
        {' · '}<span style={{ color: '#4A4540' }}>{appt.client_phone}</span>
      </p>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
        </div>
      )}

      {fetchError && (
        <p className="text-sm text-center py-6" style={{ color: '#FF8080' }}>
          Error al cargar historial.
        </p>
      )}

      {!loading && !fetchError && stats && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Completadas', value: stats.completed },
            { label: 'Canceladas', value: stats.cancelled },
            { label: 'No-show', value: stats.noShow },
          ].map(item => (
            <div key={item.label}
              className="rounded-xl p-2 text-center"
              style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.1)' }}>
              <p className="text-lg font-bold" style={{ color: '#C9A96E' }}>{item.value}</p>
              <p className="text-xs" style={{ color: '#4A4540' }}>{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && !fetchError && appointments.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: '#4A4540' }}>
          Sin historial de citas.
        </p>
      )}

      {!loading && !fetchError && appointments.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
          {appointments.map(a => {
            const s = statusLabel[a.status] ?? { label: a.status, color: '#7A7268' }
            return (
              <div key={a.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F2EDE7' }}>
                    {a.slot_date} · {a.slot_start_time.slice(0, 5)}
                  </p>
                  {a.notes && (
                    <p className="text-xs truncate max-w-[160px]" style={{ color: '#4A4540' }}>{a.notes}</p>
                  )}
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: s.color, backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-5">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.15)', color: '#7A7268', cursor: 'pointer', background: 'none' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

/* ─── Main AgendaModal ───────────────────────────────────────── */
const TITLES: Partial<Record<AgendaModalMode['type'], string>> = {
  'create-appointment':    'Nueva cita',
  'edit-appointment':      'Editar cita',
  'cancel-appointment':    'Cancelar cita',
  'block-slot':            'Gestionar hueco',
  'edit-slot-times':       'Editar horario',
  'bulk-creator':          'Crear franjas',
  'reschedule-appointment':'Reagendar cita',
  'mark-no-show':          'Marcar no-show',
  'mark-completed':        'Cita completada',
  'client-history':        'Historial de cliente',
}

export default function AgendaModal({ mode, onClose, onSuccess, barberId }: AgendaModalProps) {
  const open = mode.type !== 'closed'

  function handleSuccess() {
    onClose()
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        className="max-w-md"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)', color: '#F2EDE7' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: '#F2EDE7', fontSize: '1rem', fontWeight: 600 }}>
            {open ? TITLES[mode.type] ?? '' : ''}
          </DialogTitle>
        </DialogHeader>

        {mode.type === 'create-appointment' && (
          <CreateAppointmentForm slot={mode.slot} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'edit-appointment' && (
          <EditAppointmentForm appointment={mode.appointment} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'cancel-appointment' && (
          <CancelAppointmentForm appointment={mode.appointment} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'block-slot' && (
          <BlockSlotForm slot={mode.slot} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'edit-slot-times' && (
          <EditSlotTimesForm slot={mode.slot} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'bulk-creator' && barberId && (
          <SlotBulkCreator defaultDate={mode.date} barberId={barberId} onCreated={handleSuccess} />
        )}
        {mode.type === 'reschedule-appointment' && (
          <RescheduleAppointmentForm appointment={mode.appointment} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'mark-no-show' && (
          <MarkNoShowForm appointment={mode.appointment} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'mark-completed' && (
          <MarkCompletedForm appointment={mode.appointment} onClose={onClose} onSuccess={handleSuccess} />
        )}
        {mode.type === 'client-history' && (
          <ClientHistoryPanel appointment={mode.appointment} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
