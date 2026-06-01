'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import BookingCalendar from '@/components/landing/BookingCalendar'
import TimeSlotPicker from '@/components/landing/TimeSlotPicker'
import type { Appointment } from '@/types'
import { rescheduleAppointment } from '@/actions/appointments'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

type Step = 'date' | 'slot' | 'confirm'

interface RescheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  onSuccess: () => void
}

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function RescheduleModal({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: RescheduleModalProps) {
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleClose(v: boolean) {
    if (!v) {
      // Reset state on close
      setStep('date')
      setSelectedDate(null)
      setSelectedSlot(null)
    }
    onOpenChange(v)
  }

  function handleDateSelect(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('slot')
  }

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot) return
    setLoading(true)
    try {
      const result = await rescheduleAppointment(appointment.id, {
        slot_date: selectedDate,
        slot_start_time: selectedSlot.start_time,
        slot_end_time: selectedSlot.end_time,
      })
      if ('error' in result) {
        const msgs: Record<string, string> = {
          UNAUTHORIZED: 'Debes iniciar sesión.',
          NOT_FOUND: 'Cita no encontrada.',
          NOT_OWNER: 'No tienes permiso.',
          NOT_CONFIRMED: 'Solo puedes reagendar citas confirmadas.',
          RESCHEDULE_TOO_LATE: 'Ya no es posible reagendar con tan poca antelación.',
          SLOT_NOT_FOUND: 'El horario seleccionado ya no está disponible.',
          SLOT_TAKEN: 'El horario seleccionado acaba de ser reservado. Elige otro.',
          VALIDATION_ERROR: 'Datos inválidos.',
          UPDATE_FAILED:       'No se pudo reagendar. Inténtalo de nuevo.',
        }
        if (result.error === 'SLOT_TAKEN') {
          setRefreshKey((k) => k + 1)
          setStep('slot')
        }
        toast.error((result.error ? msgs[result.error] : undefined) ?? 'Error al reagendar la cita.')
      } else {
        toast.success('Cita reagendada correctamente.')
        handleClose(false)
        onSuccess()
      }
    } catch {
      toast.error('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const stepLabels: Record<Step, string> = {
    date: 'Elige un día',
    slot: 'Elige un horario',
    confirm: 'Confirmar cambio',
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton
        className="max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#161310',
          border: '1px solid rgba(201,169,110,0.15)',
          maxWidth: '420px',
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'date' && (
              <button
                onClick={() => {
                  if (step === 'slot') setStep('date')
                  else if (step === 'confirm') setStep('slot')
                }}
                className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150"
                style={{ color: '#C9A96E', backgroundColor: 'rgba(201,169,110,0.08)' }}
              >
                <ArrowLeft size={14} weight="bold" />
              </button>
            )}
            <DialogTitle style={{ color: '#F2EDE7' }}>
              {stepLabels[step]}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 pb-2">
          {(['date', 'slot', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2"
            >
              <div
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor:
                    step === s
                      ? '#C9A96E'
                      : i < (['date', 'slot', 'confirm'] as Step[]).indexOf(step)
                        ? 'rgba(201,169,110,0.5)'
                        : 'rgba(201,169,110,0.15)',
                }}
              />
              {i < 2 && (
                <div
                  className="h-px w-6"
                  style={{ backgroundColor: 'rgba(201,169,110,0.15)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="pt-1">
          {step === 'date' && (
            <BookingCalendar
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              barberId={appointment.barber_id ?? undefined}
            />
          )}

          {step === 'slot' && selectedDate && (
            <TimeSlotPicker
              date={selectedDate}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSlotSelect}
              refreshKey={refreshKey}
              barberId={appointment.barber_id ?? undefined}
            />
          )}

          {step === 'confirm' && selectedDate && selectedSlot && (
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.12)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} weight="fill" style={{ color: '#C9A96E' }} />
                  <p className="text-sm font-medium" style={{ color: '#C9A96E' }}>
                    Nuevo horario seleccionado
                  </p>
                </div>
                <p className="text-base font-semibold capitalize" style={{ color: '#F2EDE7' }}>
                  {formatDate(selectedDate)}
                </p>
                <p className="text-sm mt-1" style={{ color: '#7A7268' }}>
                  {selectedSlot.start_time.slice(0, 5)} — {selectedSlot.end_time.slice(0, 5)}
                </p>
              </div>

              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: '#7A7268' }}>
                  Cita actual
                </p>
                <p className="text-sm capitalize" style={{ color: '#7A7268' }}>
                  {formatDate(appointment.slot_date)} · {appointment.slot_start_time.slice(0, 5)}
                </p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
                style={{
                  backgroundColor: loading ? 'rgba(201,169,110,0.5)' : '#C9A96E',
                  color: '#0E0B08',
                }}
              >
                {loading ? 'Reagendando...' : 'Confirmar cambio'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
