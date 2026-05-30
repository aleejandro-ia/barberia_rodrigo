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
} from '@/actions/agenda'
import { adminCancelAppointment } from '@/actions/appointments'
import SlotBulkCreator from '@/components/admin/SlotBulkCreator'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AvailabilitySlot, Appointment } from '@/types'

/* ─── Modal mode union ───────────────────────────────────────── */
export type AgendaModalMode =
  | { type: 'closed' }
  | { type: 'create-appointment'; slot: AvailabilitySlot }
  | { type: 'edit-appointment';   appointment: Appointment }
  | { type: 'cancel-appointment'; appointment: Appointment }
  | { type: 'block-slot';         slot: AvailabilitySlot }
  | { type: 'edit-slot-times';    slot: AvailabilitySlot }
  | { type: 'bulk-creator';       date: string }

interface AgendaModalProps {
  mode:      AgendaModalMode
  onClose:   () => void
  onSuccess: () => void
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

/* ─── Main AgendaModal ───────────────────────────────────────── */
const TITLES: Partial<Record<AgendaModalMode['type'], string>> = {
  'create-appointment': 'Nueva cita',
  'edit-appointment':   'Editar cita',
  'cancel-appointment': 'Cancelar cita',
  'block-slot':         'Gestionar hueco',
  'edit-slot-times':    'Editar horario',
  'bulk-creator':       'Crear franjas',
}

export default function AgendaModal({ mode, onClose, onSuccess }: AgendaModalProps) {
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
        {mode.type === 'bulk-creator' && (
          <SlotBulkCreator defaultDate={mode.date} onCreated={handleSuccess} />
        )}
      </DialogContent>
    </Dialog>
  )
}
