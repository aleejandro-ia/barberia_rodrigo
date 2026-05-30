'use client'

import { useState, useCallback } from 'react'
import { deleteAvailabilitySlot } from '@/actions/availability'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import SlotBulkCreator from './SlotBulkCreator'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
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

export default function ScheduleManager() {
  const [date, setDate] = useState(todayStr())
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchSlots = useCallback(async (d: string) => {
    if (!d) return
    setSlotsLoading(true)
    setSlotsError(null)
    try {
      const res = await fetch(`/api/availability/slots?date=${d}`)
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setSlotsError('Error al cargar franjas')
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value
    setDate(d)
    if (d) fetchSlots(d)
    else setSlots([])
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const result = await deleteAvailabilitySlot(deleteTarget.id)
      if ('error' in result) {
        const msg =
          result.error === 'HAS_BOOKING'
            ? 'Esta franja tiene una cita confirmada y no puede eliminarse.'
            : result.error === 'NOT_FOUND'
              ? 'Franja no encontrada.'
              : 'Error al eliminar.'
        setDeleteError(msg)
      } else {
        setDeleteTarget(null)
        fetchSlots(date)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Slots viewer */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9A96E' }}>
            Franjas por fecha
          </h2>

          <div className="mb-5">
            <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: '#7A7268' }}>
              Fecha
            </label>
            <input
              id="schedule-date"
              type="date"
              value={date}
              onChange={handleDateChange}
              style={{ ...inputStyle, maxWidth: '220px' }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.15)')}
            />
          </div>

          {slotsLoading ? (
            <div className="flex items-center gap-2 py-4">
              <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
              <span className="text-sm" style={{ color: '#7A7268' }}>Cargando…</span>
            </div>
          ) : slotsError ? (
            <p className="text-sm py-4" style={{ color: '#FF8080' }}>{slotsError}</p>
          ) : !date ? (
            <p className="text-sm py-4" style={{ color: '#4A4540' }}>Selecciona una fecha</p>
          ) : slots.length === 0 ? (
            <p className="text-sm py-4" style={{ color: '#4A4540' }}>No hay franjas para esta fecha</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                  style={{
                    backgroundColor: 'rgba(201,169,110,0.06)',
                    border: '1px solid rgba(201,169,110,0.15)',
                  }}
                >
                  {/* Green dot */}
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#4ADE80' }} />
                  <span className="text-sm font-medium tabular-nums" style={{ color: '#F2EDE7' }}>
                    {slot.start_time.slice(0, 5)}
                  </span>
                  <button
                    onClick={() => setDeleteTarget(slot)}
                    className="ml-1 text-xs transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: '#7A7268' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF8080')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#7A7268')}
                    aria-label="Eliminar franja"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bulk creator */}
        <SlotBulkCreator
          defaultDate={date}
          onCreated={() => fetchSlots(date)}
        />
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) { setDeleteTarget(null); setDeleteError(null) }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar franja</DialogTitle>
            <DialogDescription>
              ¿Eliminar la franja{' '}
              <strong className="text-zinc-200">
                {deleteTarget?.start_time.slice(0, 5)} – {deleteTarget?.end_time.slice(0, 5)}
              </strong>
              ? Si hay una cita confirmada, no podrá eliminarse.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#FF8080', backgroundColor: 'rgba(255,128,128,0.08)' }}>
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <button
              onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
              disabled={deleting}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            {!deleteError && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: 'rgba(255,80,80,0.15)', color: '#FF8080', border: '1px solid rgba(255,80,80,0.25)' }}
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
