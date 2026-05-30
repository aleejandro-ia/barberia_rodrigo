'use client'

import { useState } from 'react'
import { bulkCreateSlots } from '@/actions/availability'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  defaultDate?: string
  onCreated?: () => void
}

export default function SlotBulkCreator({ defaultDate = '', onCreated }: Props) {
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

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-sm font-semibold text-zinc-200 mb-4">Crear franjas horarias</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bulk-date" className="text-zinc-400 text-xs mb-1.5 block">
              Fecha
            </Label>
            <Input
              id="bulk-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="text-zinc-300"
            />
          </div>
          <div>
            <Label htmlFor="bulk-duration" className="text-zinc-400 text-xs mb-1.5 block">
              Duración
            </Label>
            <Select value={duration} onValueChange={(v) => { if (v !== null) setDuration(v) }}>
              <SelectTrigger id="bulk-duration" className="w-full text-zinc-300">
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
            <Label htmlFor="bulk-from" className="text-zinc-400 text-xs mb-1.5 block">
              Desde
            </Label>
            <Input
              id="bulk-from"
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              required
              className="text-zinc-300"
            />
          </div>
          <div>
            <Label htmlFor="bulk-to" className="text-zinc-400 text-xs mb-1.5 block">
              Hasta
            </Label>
            <Input
              id="bulk-to"
              type="time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              required
              className="text-zinc-300"
            />
          </div>
        </div>

        {result && (
          <div
            className={`text-sm px-3 py-2 rounded-md ${
              result.error
                ? 'bg-red-500/10 text-red-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {result.error
              ? result.error
              : `Se crearon ${result.created} franja${result.created !== 1 ? 's' : ''} horaria${result.created !== 1 ? 's' : ''}`}
          </div>
        )}

        <Button type="submit" disabled={loading || !date}>
          {loading ? 'Creando…' : 'Crear franjas horarias'}
        </Button>
      </form>
    </div>
  )
}
