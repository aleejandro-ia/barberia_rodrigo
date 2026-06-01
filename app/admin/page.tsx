'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
} from 'date-fns'
import MonthCalNav        from '@/components/admin/agenda/MonthCalNav'
import MonthlyCalendarGrid from '@/components/admin/agenda/MonthlyCalendarGrid'
import AgendaDayPanel     from '@/components/admin/agenda/AgendaDayPanel'
import AgendaModal, { type AgendaModalMode } from '@/components/admin/agenda/AgendaModal'
import type { AgendaDay, AvailabilitySlot, Appointment, Barber } from '@/types'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function AdminPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()))
  const [days,         setDays]         = useState<AgendaDay[]>([])
  const [loading,      setLoading]      = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => todayStr())
  const [modalMode,    setModalMode]    = useState<AgendaModalMode>({ type: 'closed' })
  const [barberMap,    setBarberMap]    = useState<Map<string, string>>(new Map())
  const [barberCount,  setBarberCount]  = useState(0)

  /* ─── Fetch month data ─────────────────────────────────────── */
  const fetchMonth = useCallback(async (month: Date) => {
    setLoading(true)
    try {
      const from = format(startOfMonth(month), 'yyyy-MM-dd')
      const to   = format(endOfMonth(month),   'yyyy-MM-dd')
      const res  = await fetch(`/api/admin/agenda?from=${from}&to=${to}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDays(data.days ?? [])
    } catch {
      setDays([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonth(currentMonth)
  }, [currentMonth, fetchMonth])

  // Fetch barbers for badge display
  useEffect(() => {
    fetch('/api/barbers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list: Barber[] = data?.barbers ?? []
        setBarberCount(list.length)
        const map = new Map<string, string>()
        for (const b of list) map.set(b.id, b.name)
        setBarberMap(map)
      })
      .catch(() => {/* silent */})
  }, [])

  /* ─── Month navigation ─────────────────────────────────────── */
  const goToPrev  = () => setCurrentMonth((m) => subMonths(m, 1))
  const goToNext  = () => setCurrentMonth((m) => addMonths(m, 1))
  const goToToday = () => {
    setCurrentMonth(startOfMonth(new Date()))
    setSelectedDate(todayStr())
  }

  /* ─── Derived state ────────────────────────────────────────── */
  const today      = todayStr()
  const todayDay   = days.find((d) => d.date === today)
  const todayCount = todayDay?.confirmedCount ?? 0
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
  function openRescheduleAppointment(appointment: Appointment) {
    setModalMode({ type: 'reschedule-appointment', appointment })
  }
  function openMarkNoShow(appointment: Appointment) {
    setModalMode({ type: 'mark-no-show', appointment })
  }
  function openMarkCompleted(appointment: Appointment) {
    setModalMode({ type: 'mark-completed', appointment })
  }
  function openClientHistory(appointment: Appointment) {
    setModalMode({ type: 'client-history', appointment })
  }
  function closeModal() {
    setModalMode({ type: 'closed' })
  }
  function handleSuccess() {
    closeModal()
    fetchMonth(currentMonth)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Agenda
        </h1>
      </div>

      {/* Today summary row */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.08)' }}
      >
        <div>
          <p className="text-xs font-medium" style={{ color: '#7A7268' }}>Hoy</p>
          {loading ? (
            <div
              className="mt-1 w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
            />
          ) : (
            <p className="text-sm font-semibold" style={{ color: '#F2EDE7' }}>
              {todayCount > 0
                ? `${todayCount} cita${todayCount > 1 ? 's' : ''} confirmada${todayCount > 1 ? 's' : ''}`
                : 'Sin citas confirmadas'}
            </p>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start">
        {/* Left: calendar */}
        <div>
          <MonthCalNav
            currentMonth={currentMonth}
            onPrev={goToPrev}
            onNext={goToNext}
            onToday={goToToday}
          />

          {loading ? (
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ height: 320, backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
            >
              <div
                className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
              />
            </div>
          ) : (
            <MonthlyCalendarGrid
              days={days}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              currentMonth={currentMonth}
            />
          )}
        </div>

        {/* Right: day panel — desktop sticky */}
        <div className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <AgendaDayPanel
            day={selectedDay}
            onBlock={openBlockSlot}
            onEditSlot={openEditSlotTimes}
            onCreateAppointment={openCreateAppointment}
            onEditAppointment={openEditAppointment}
            onCancelAppointment={openCancelAppointment}
            onOpenBulkCreator={openBulkCreator}
            onRescheduleAppointment={openRescheduleAppointment}
            onMarkNoShow={openMarkNoShow}
            onMarkCompleted={openMarkCompleted}
            onViewClientHistory={openClientHistory}
            barberMap={barberMap}
            barberCount={barberCount}
          />
        </div>
      </div>

      {/* Mobile: day panel below grid when date selected */}
      <div className="lg:hidden">
        {selectedDate && (
          <AgendaDayPanel
            day={selectedDay}
            onBlock={openBlockSlot}
            onEditSlot={openEditSlotTimes}
            onCreateAppointment={openCreateAppointment}
            onEditAppointment={openEditAppointment}
            onCancelAppointment={openCancelAppointment}
            onOpenBulkCreator={openBulkCreator}
            onRescheduleAppointment={openRescheduleAppointment}
            onMarkNoShow={openMarkNoShow}
            onMarkCompleted={openMarkCompleted}
            onViewClientHistory={openClientHistory}
            barberMap={barberMap}
            barberCount={barberCount}
          />
        )}
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
