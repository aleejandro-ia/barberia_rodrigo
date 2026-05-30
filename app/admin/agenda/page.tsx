'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks,
  format, parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import AgendaWeekNav   from '@/components/admin/agenda/AgendaWeekNav'
import AgendaWeekGrid  from '@/components/admin/agenda/AgendaWeekGrid'
import AgendaDayPanel  from '@/components/admin/agenda/AgendaDayPanel'
import AgendaModal, { type AgendaModalMode } from '@/components/admin/agenda/AgendaModal'
import type { AgendaDay, AvailabilitySlot, Appointment } from '@/types'

/* ─── Date helpers ───────────────────────────────────────────── */
function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function getWeekStart(d: Date) {
  return startOfWeek(d, { weekStartsOn: 1 })   // Monday
}

function getWeekEnd(d: Date) {
  return endOfWeek(d, { weekStartsOn: 1 })      // Sunday
}

function weekLabel(weekStartDate: Date) {
  const end  = getWeekEnd(weekStartDate)
  const from = format(weekStartDate, "d MMM", { locale: es })
  const to   = format(end,           "d MMM yyyy", { locale: es })
  return `${from} — ${to}`
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function AdminAgendaPage() {
  const [weekStart,    setWeekStart]    = useState<Date>(() => getWeekStart(new Date()))
  const [days,         setDays]         = useState<AgendaDay[]>([])
  const [loading,      setLoading]      = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateStr(new Date()))
  const [modalMode,    setModalMode]    = useState<AgendaModalMode>({ type: 'closed' })

  /* ─── Fetch week data ──────────────────────────────────────── */
  const fetchWeek = useCallback(async (ws: Date) => {
    setLoading(true)
    try {
      const from = toDateStr(ws)
      const to   = toDateStr(getWeekEnd(ws))
      const res  = await fetch(`/api/admin/agenda?from=${from}&to=${to}`)
      if (!res.ok) throw new Error()
      const { days: fetched } = await res.json()
      setDays(fetched ?? [])
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeek(weekStart)
  }, [weekStart, fetchWeek])

  /* ─── Week navigation ──────────────────────────────────────── */
  const goToPrev  = () => setWeekStart((w) => subWeeks(w, 1))
  const goToNext  = () => setWeekStart((w) => addWeeks(w, 1))
  const goToToday = () => {
    const today = new Date()
    setWeekStart(getWeekStart(today))
    setSelectedDate(toDateStr(today))
  }

  /* ─── Derived: selected day data ──────────────────────────── */
  const selectedDay = days.find((d) => d.date === selectedDate) ?? null

  /* ─── Modal openers ────────────────────────────────────────── */
  function openCreateAppointment(slot: AvailabilitySlot) {
    setModalMode({ type: 'create-appointment', slot })
  }
  function openEditAppointment(appointment: Appointment) {
    setModalMode({ type: 'edit-appointment', appointment })
  }
  function openCancelAppointment(appointment: Appointment) {
    setModalMode({ type: 'cancel-appointment', appointment })
  }
  function openBlockSlot(slot: AvailabilitySlot) {
    setModalMode({ type: 'block-slot', slot })
  }
  function openEditSlotTimes(slot: AvailabilitySlot) {
    setModalMode({ type: 'edit-slot-times', slot })
  }
  function openBulkCreator(date: string) {
    setModalMode({ type: 'bulk-creator', date })
  }
  function closeModal() {
    setModalMode({ type: 'closed' })
  }
  function handleSuccess() {
    closeModal()
    fetchWeek(weekStart)
  }

  /* ─── Select day → ensure week contains that day ──────────── */
  function handleSelectDay(date: string) {
    setSelectedDate(date)
    const parsed = parseISO(date)
    const ws     = getWeekStart(parsed)
    if (toDateStr(ws) !== toDateStr(weekStart)) {
      setWeekStart(ws)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Agenda
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A7268' }}>
          Gestiona huecos y citas de forma visual.
        </p>
      </div>

      {/* Week navigation */}
      <AgendaWeekNav
        weekLabel={weekLabel(weekStart)}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        loading={loading}
      />

      {/* Main layout: week grid + day panel */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px] items-start">

        {/* Week grid */}
        <AgendaWeekGrid
          weekStart={toDateStr(weekStart)}
          days={days}
          selectedDate={selectedDate}
          onSelectDay={handleSelectDay}
          loading={loading}
        />

        {/* Day panel — sticky on desktop */}
        <div className="lg:sticky lg:top-20">
          <AgendaDayPanel
            day={selectedDay}
            onBlock={openBlockSlot}
            onEditSlot={openEditSlotTimes}
            onCreateAppointment={openCreateAppointment}
            onEditAppointment={openEditAppointment}
            onCancelAppointment={openCancelAppointment}
            onOpenBulkCreator={openBulkCreator}
          />
        </div>
      </div>

      {/* Modal */}
      <AgendaModal
        mode={modalMode}
        onClose={closeModal}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
