'use client'

import { useState } from 'react'
import { bulkCreateSlots } from '@/actions/availability'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  defaultDate?: string
  barberId: string
  onCreated?: () => void
  /** When rendered inside a modal that already provides card chrome + title,
   *  drop the outer card background/border/padding and the duplicate heading. */
  embedded?: boolean
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border: '1px solid rgba(201,169,110,0.15)',
  color: '#F2EDE7',
  borderRadius: '0.75rem',
  padding: '0.65rem 0.875rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
}

export default function SlotBulkCreator({ defaultDate = '', barberId, onCreated, embedded = false }: Props) {
  const [date, setDate] = useState(defaultDate)
  const [fromTime, setFromTime] = useState('09:00')
  const [toTime, setToTime] = useState('13:00')
  const [duration, setDuration] = useState('30')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created?: number; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await bulkCreateSlots({
        date,
        barber_id: barberId,
        from_time: fromTime,
        to_time: toTime,
        slot_duration: parseInt(duration, 10),
      })
      if ('error' in res) {
        const msg =
          res.error === 'UNAUTHORIZED'
            ? 'Sin permisos.'
            : res.error === 'VALIDATION_ERROR'
              ? 'Verifica los datos ingresados.'
              : 'Error inesperado.'
        setResult({ error: msg })
      } else {
        setResult({ created: res.created })
        onCreated?.()
      }
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#7A7268',
    display: 'block',
    marginBottom: '0.5rem',
  }

  return (
    <div
      className={embedded ? '' : 'rounded-2xl p-6'}
      style={embedded ? undefined : { backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
    >
      {!embedded && (
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9A96E' }}>
          Crear franjas horarias
        </h2>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.15)')}
            />
          </div>

          <div>
            <label style={labelStyle}>Duración</label>
            <Select value={duration} onValueChange={(v) => { if (v) setDuration(v) }}>
              <SelectTrigger className="w-full" style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label style={labelStyle}>Desde</label>
            <input
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.15)')}
            />
          </div>

          <div>
            <label style={labelStyle}>Hasta</label>
            <input
              type="time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.15)')}
            />
          </div>
        </div>

        {result && (
          <div
            className="text-sm px-4 py-3 rounded-xl"
            style={
              result.error
                ? {
                    color: '#FF8080',
                    backgroundColor: 'rgba(255,128,128,0.08)',
                    border: '1px solid rgba(255,128,128,0.2)',
                  }
                : {
                    color: '#4ADE80',
                    backgroundColor: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.2)',
                  }
            }
          >
            {result.error
              ? result.error
              : `✓ Se crearon ${result.created} franja${result.created !== 1 ? 's' : ''} horaria${result.created !== 1 ? 's' : ''}`}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !date}
          className="py-3 rounded-full text-sm font-semibold transition-all"
          style={{
            backgroundColor: !loading && date ? '#C9A96E' : 'rgba(201,169,110,0.15)',
            color: !loading && date ? '#0E0B08' : '#4A4540',
            cursor: !loading && date ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Creando franjas…' : 'Crear franjas horarias'}
        </button>
      </form>
    </div>
  )
}
