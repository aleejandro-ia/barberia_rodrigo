'use client'

import { useState } from 'react'
import { bookAppointment } from '@/actions/appointments'
import type { Appointment } from '@/types'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

interface BookingFormProps {
  date: string
  slot: Slot
  initialName?: string
  initialPhone?: string
  onSuccess: (appointment: Appointment) => void
}

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: 'Este hueco ya fue reservado. Por favor elige otro horario.',
  ALREADY_HAS_BOOKING: 'Ya tienes una cita activa. Contacta con nosotros para cambiarla.',
  VALIDATION_ERROR: 'Revisa los datos introducidos.',
  UNAUTHORIZED: 'Debes iniciar sesion para reservar.',
  SLOT_NOT_FOUND: 'El hueco seleccionado no esta disponible.',
  DEFAULT: 'Algo ha fallado. Intentalo de nuevo.',
}

export default function BookingForm({
  date,
  slot,
  initialName = '',
  initialPhone = '',
  onSuccess,
}: BookingFormProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await bookAppointment({
      slot_date: date,
      slot_start_time: slot.start_time,
      slot_end_time: slot.end_time,
      client_name: name.trim(),
      client_phone: phone.trim(),
      notes: notes.trim() || undefined,
    })

    setLoading(false)

    if ('error' in result && result.error) {
      setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.DEFAULT)
      return
    }

    if ('appointment' in result && result.appointment) {
      onSuccess(result.appointment as Appointment)
    }
  }

  const inputStyle = {
    backgroundColor: '#1A1A1A',
    border: '1px solid rgba(201,169,110,0.2)',
    color: '#F5F5F5',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-name" className="text-xs font-medium" style={{ color: '#888888' }}>
            Nombre
          </label>
          <input
            id="booking-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            required
            minLength={2}
            maxLength={100}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.6)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-phone" className="text-xs font-medium" style={{ color: '#888888' }}>
            Telefono
          </label>
          <input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            required
            minLength={6}
            maxLength={20}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.6)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="booking-notes" className="text-xs font-medium" style={{ color: '#888888' }}>
          Notas opcionales
        </label>
        <textarea
          id="booking-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tipo de corte, preferencias..."
          maxLength={500}
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.6)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
        />
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
        type="submit"
        disabled={loading}
        className="mt-2 py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
      >
        {loading ? 'Reservando...' : 'Confirmar reserva'}
      </button>
    </form>
  )
}
