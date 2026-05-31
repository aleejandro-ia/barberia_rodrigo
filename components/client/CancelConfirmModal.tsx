'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { WarningCircle } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Appointment } from '@/types'
import { cancelAppointment } from '@/actions/appointments'

interface CancelConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  onSuccess: () => void
}

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function CancelConfirmModal({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: CancelConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      const result = await cancelAppointment(appointment.id)
      if ('error' in result) {
        const msgs: Record<string, string> = {
          UNAUTHORIZED: 'Debes iniciar sesión.',
          NOT_FOUND: 'Cita no encontrada.',
          NOT_OWNER: 'No tienes permiso.',
          ALREADY_CANCELLED: 'Esta cita ya fue cancelada.',
          CANCEL_TOO_LATE: 'Ya no es posible cancelar con tan poca antelación.',
          UPDATE_FAILED:    'No se pudo cancelar. Inténtalo de nuevo.',
        }
        toast.error((result.error ? msgs[result.error] : undefined) ?? 'Error al cancelar la cita.')
      } else {
        toast.success('Cita cancelada correctamente.')
        onOpenChange(false)
        onSuccess()
      }
    } catch {
      toast.error('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: '#F2EDE7' }}>Cancelar cita</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div
            className="flex items-start gap-3 rounded-xl p-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <WarningCircle size={18} weight="fill" style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: '#EF4444' }}>
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.12)' }}>
            <p className="text-sm font-medium capitalize" style={{ color: '#F2EDE7' }}>
              {formatDate(appointment.slot_date)}
            </p>
            <p className="text-sm mt-0.5" style={{ color: '#7A7268' }}>
              {appointment.slot_start_time.slice(0, 5)} — {appointment.slot_end_time.slice(0, 5)}
            </p>
            {appointment.notes && (
              <p className="text-sm mt-1" style={{ color: '#7A7268' }}>
                {appointment.notes}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              color: '#7A7268',
              border: '1px solid rgba(122,114,104,0.25)',
              backgroundColor: 'transparent',
            }}
          >
            Mantener cita
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              color: '#fff',
              backgroundColor: loading ? 'rgba(239,68,68,0.5)' : '#EF4444',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            {loading ? 'Cancelando...' : 'Cancelar cita'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
