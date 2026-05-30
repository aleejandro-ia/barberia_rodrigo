'use client'

import { useState } from 'react'
import { adminCancelAppointment } from '@/actions/appointments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <div className="text-center py-16 text-zinc-500">
        No hay citas próximas
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
            : 'Error al cancelar.'
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
      <div className="space-y-8">
        {sortedDates.map((date) => (
          <div key={date}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 capitalize">
              {formatDate(date)}
            </h3>
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900">
                    <th className="px-4 py-2 text-left text-zinc-400 font-medium">Hora</th>
                    <th className="px-4 py-2 text-left text-zinc-400 font-medium">Cliente</th>
                    <th className="px-4 py-2 text-left text-zinc-400 font-medium hidden sm:table-cell">Teléfono</th>
                    <th className="px-4 py-2 text-left text-zinc-400 font-medium hidden md:table-cell">Notas</th>
                    <th className="px-4 py-2 text-left text-zinc-400 font-medium">Estado</th>
                    <th className="px-4 py-2 text-left text-zinc-400 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[date].map((appt) => (
                    <tr key={appt.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-200 whitespace-nowrap">
                        {appt.slot_start_time.slice(0, 5)} – {appt.slot_end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-zinc-200">{appt.client_name}</td>
                      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{appt.client_phone}</td>
                      <td className="px-4 py-3 text-zinc-400 hidden md:table-cell max-w-xs truncate">
                        {appt.notes ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {appt.status === 'confirmed' ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Confirmada
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Cancelada
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {appt.status === 'confirmed' && (
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => setCancelTarget(appt)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) { setCancelTarget(null); setError(null) } }}>
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setCancelTarget(null); setError(null) }}
              disabled={loading}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? 'Cancelando…' : 'Sí, cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
