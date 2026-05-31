'use client'

import { useState, useEffect, useCallback } from 'react'
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns'
import { es } from 'date-fns/locale'
import AgendaWeekNav from '@/components/admin/agenda/AgendaWeekNav'
import AgendaWeekGrid from '@/components/admin/agenda/AgendaWeekGrid'
import AgendaDayPanel from '@/components/admin/agenda/AgendaDayPanel'
import AgendaModal, { type AgendaModalMode } from '@/components/admin/agenda/AgendaModal'
import type { AgendaDay, AvailabilitySlot, Appointment } from '@/types'

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function weekEndDate(weekStart: Date): Date {
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
}

export default function AgendaPage() {
  const [weekStart,    setWeekStart]    = useState<Date>(() => getWeekStart(new Date()))
  const [days,         setDays]         = useState<AgendaDay[]>([])
  const [loading,      setLoading]      = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => format(new Date(), 'yyyy-MM-dd'))
  const [modalMode,    setModalMode]    = useState<AgendaModalMode>({ type: 'closed' })

  const weekLabel = (() => {
    const end = weekEndDate(weekStart)
    const sameMonth = weekStart.getMonth() === end.getMonth()
    if (sameMonth) {
      return `${format(weekStart, "d", { locale: es })} – ${format(end, "d 'de' MMMM, yyyy", { locale: es })}`
    }
    return `${format(weekStart, "d 'de' MMM", { locale: es })} – ${format(end, "d 'de' MMM, yyyy", { locale: es })}`
  })()

  const fetchWeek = useCallback(async () => {
    setLoading(true)
    try {
      const from = format(weekStart, 'yyyy-MM-dd')
      const to   = format(weekEndDate(weekStart), 'yyyy-MM-dd')
      const res  = await fetch(`/api/admin/agenda?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setDays(data.days ?? [])
    } catch (e) {
      console.error('[AgendaPage] fetch failed', e)
      setDays([])
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { fetchWeek() }, [fetchWeek])

  const selectedDay = selectedDate
    ? (days.find(d => d.date === selectedDate) ?? null)
    : null

  function handlePrev()  { setWeekStart(w => subWeeks(w, 1)) }
  function handleNext()  { setWeekStart(w => addWeeks(w, 1)) }
  function handleToday() {
    const today = new Date()
    setWeekStart(getWeekStart(today))
    setSelectedDate(format(today, 'yyyy-MM-dd'))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 lg:items-start">

        {/* ── Left: navigation + week grid ─────────────────────── */}
        <div className="flex flex-col gap-4">
          <AgendaWeekNav
            weekLabel={weekLabel}
            weekStart={weekStart}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            loading={loading}
          />
          <AgendaWeekGrid
            weekStart={format(weekStart, 'yyyy-MM-dd')}
            days={days}
            selectedDate={selectedDate}
            onSelectDay={(date) => setSelectedDate(date)}
            loading={loading}
          />
        </div>

        {/* ── Right: day detail panel ───────────────────────────── */}
        <div className="lg:sticky lg:top-20">
          <AgendaDayPanel
            day={selectedDay}
            onBlock={(slot: AvailabilitySlot) =>
              setModalMode({ type: 'block-slot', slot })
            }
            onEditSlot={(slot: AvailabilitySlot) =>
              setModalMode({ type: 'edit-slot-times', slot })
            }
            onCreateAppointment={(slot: AvailabilitySlot) =>
              setModalMode({ type: 'create-appointment', slot })
            }
            onEditAppointment={(appointment: Appointment) =>
              setModalMode({ type: 'edit-appointment', appointment })
            }
            onCancelAppointment={(appointment: Appointment) =>
              setModalMode({ type: 'cancel-appointment', appointment })
            }
            onOpenBulkCreator={(date: string) =>
              setModalMode({ type: 'bulk-creator', date })
            }
            onRescheduleAppointment={(appointment: Appointment) =>
              setModalMode({ type: 'reschedule-appointment', appointment })
            }
            onMarkNoShow={(appointment: Appointment) =>
              setModalMode({ type: 'mark-no-show', appointment })
            }
            onMarkCompleted={(appointment: Appointment) =>
              setModalMode({ type: 'mark-completed', appointment })
            }
            onViewClientHistory={(appointment: Appointment) =>
              setModalMode({ type: 'client-history', appointment })
            }
          />
        </div>
      </div>

      <AgendaModal
        mode={modalMode}
        onClose={() => setModalMode({ type: 'closed' })}
        onSuccess={fetchWeek}
      />
    </div>
  )
}
