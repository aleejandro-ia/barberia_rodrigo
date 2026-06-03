'use client'

import { useState } from 'react'

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
  onReview: (data: { name: string; phone: string; notes: string }) => void
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
  date: _date,
  slot: _slot,
  initialName = '',
  initialPhone = '',
  onReview,
}: BookingFormProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    // Server requires exactly 9 digits after stripping spaces — validate the
    // same rule here so a valid-looking number is never rejected post-submit.
    const cleanPhone = phone.replace(/\s/g, '')
    if (!/^\d{9}$/.test(cleanPhone)) {
      setError('El teléfono debe tener 9 dígitos, sin prefijo.')
      return
    }
    onReview({ name: name.trim(), phone: cleanPhone, notes: notes.trim() })
  }

  const inputStyle = {
    backgroundColor: '#1C1915',
    border: '1px solid rgba(201,169,110,0.2)',
    color: '#F2EDE7',
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
          <label htmlFor="booking-name" className="text-xs font-medium" style={{ color: '#7A7268' }}>
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
          <label htmlFor="booking-phone" className="text-xs font-medium" style={{ color: '#7A7268' }}>
            Telefono
          </label>
          <input
            id="booking-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="600 123 456"
            required
            maxLength={20}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.6)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
          />
          <span className="text-xs" style={{ color: '#4A4540' }}>9 dígitos, sin prefijo</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="booking-notes" className="text-xs font-medium" style={{ color: '#7A7268' }}>
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
        className="mt-2 py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
      >
        Revisar reserva →
      </button>
    </form>
  )
}
