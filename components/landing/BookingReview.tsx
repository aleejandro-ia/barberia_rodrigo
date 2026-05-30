'use client'

import { useState } from 'react'
import { CalendarBlank, Clock, User, Phone, ChatCircle } from '@phosphor-icons/react'
import { bookAppointment } from '@/actions/appointments'
import type { Appointment } from '@/types'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

interface BookingReviewProps {
  date: string
  slot: Slot
  formData: { name: string; phone: string; notes: string }
  onBack: () => void
  onConfirmed: (appointment: Appointment) => void
}

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: 'Este hueco ya fue reservado. Elige otro horario.',
  ALREADY_HAS_BOOKING: 'Ya tienes una cita activa.',
  VALIDATION_ERROR: 'Datos inválidos. Vuelve atrás y revisa.',
  UNAUTHORIZED: 'Sesión expirada. Recarga la página.',
  SLOT_NOT_FOUND: 'El hueco ya no está disponible.',
  DEFAULT: 'Algo falló. Inténtalo de nuevo.',
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const ROW_STYLE = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  padding: '0.875rem 1rem',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
}

export default function BookingReview({ date, slot, formData, onBack, onConfirmed }: BookingReviewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    const result = await bookAppointment({
      slot_date: date,
      slot_start_time: slot.start_time,
      slot_end_time: slot.end_time,
      client_name: formData.name,
      client_phone: formData.phone,
      notes: formData.notes || undefined,
    })
    setLoading(false)
    if ('error' in result && result.error) {
      setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.DEFAULT)
      return
    }
    if ('appointment' in result && result.appointment) {
      onConfirmed(result.appointment as Appointment)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button
          onClick={onBack}
          className="text-xs mb-4 flex items-center gap-1 transition-colors"
          style={{ color: '#888888' }}
        >
          &larr; Editar datos
        </button>
        <h3 className="text-base font-semibold mb-1" style={{ color: '#F5F5F5' }}>
          ¿Confirmas tu cita?
        </h3>
        <p className="text-xs" style={{ color: '#666' }}>
          Revisa los detalles antes de confirmar.
        </p>
      </div>

      {/* Summary card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(201,169,110,0.15)', backgroundColor: '#0D0D0D' }}
      >
        <div style={ROW_STYLE}>
          <CalendarBlank size={16} weight="duotone" style={{ color: '#C9A96E', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#555' }}>Fecha</p>
            <p className="text-sm font-medium capitalize" style={{ color: '#F5F5F5' }}>{formatDate(date)}</p>
          </div>
        </div>

        <div style={ROW_STYLE}>
          <Clock size={16} weight="duotone" style={{ color: '#C9A96E', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#555' }}>Hora</p>
            <p className="text-sm font-medium" style={{ color: '#F5F5F5' }}>
              {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
            </p>
          </div>
        </div>

        <div style={ROW_STYLE}>
          <User size={16} weight="duotone" style={{ color: '#C9A96E', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#555' }}>Nombre</p>
            <p className="text-sm font-medium" style={{ color: '#F5F5F5' }}>{formData.name}</p>
          </div>
        </div>

        <div style={{ ...ROW_STYLE, borderBottom: formData.notes ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          <Phone size={16} weight="duotone" style={{ color: '#C9A96E', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#555' }}>Teléfono</p>
            <p className="text-sm font-medium" style={{ color: '#F5F5F5' }}>{formData.phone}</p>
          </div>
        </div>

        {formData.notes && (
          <div style={{ ...ROW_STYLE, borderBottom: 'none' }}>
            <ChatCircle size={16} weight="duotone" style={{ color: '#C9A96E', marginTop: 1, flexShrink: 0 }} />
            <div>
              <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#555' }}>Notas</p>
              <p className="text-sm" style={{ color: '#AAA' }}>{formData.notes}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: 'rgba(255,80,80,0.08)',
            border: '1px solid rgba(255,80,80,0.2)',
            color: '#FF8080',
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
      >
        {loading ? 'Confirmando...' : 'Confirmar cita'}
      </button>
    </div>
  )
}
