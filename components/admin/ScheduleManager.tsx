'use client'

import { useState, useCallback } from 'react'
import { deleteAvailabilitySlot } from '@/actions/availability'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <div className="space-y-8">
        {/* Date picker + slots */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Ver franjas por fecha</h2>
          <div className="mb-5">
            <Label htmlFor="schedule-date" className="text-zinc-400 text-xs mb-1.5 block">
              Fecha
            </Label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              onChange={handleDateChange}
              className="text-zinc-300 max-w-xs"
            />
          </div>

          {slotsLoading ? (
            <div className="text-zinc-500 text-sm py-4">Cargando franjas…</div>
          ) : slotsError ? (
            <div className="text-red-400 text-sm py-4">{slotsError}</div>
          ) : !date ? (
            <div className="text-zinc-500 text-sm py-4">Selecciona una fecha</div>
          ) : slots.length === 0 ? (
            <div className="text-zinc-500 text-sm py-4">No hay franjas para esta fecha</div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-md bg-zinc-800 border border-zinc-700"
                >
                  <span className="text-sm text-zinc-200">
                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-400">Disponible</span>
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={() => setDeleteTarget(slot)}
                    >
                      Eliminar
                    </Button>
                  </div>
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
          if (!open) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
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
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null)
                setDeleteError(null)
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            {!deleteError && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
