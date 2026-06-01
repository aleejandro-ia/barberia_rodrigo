'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import AdminCalendar from '@/components/admin/agenda/AdminCalendar'
import AgendaDayPanel from '@/components/admin/agenda/AgendaDayPanel'
import AgendaModal, { type AgendaModalMode } from '@/components/admin/agenda/AgendaModal'
import type { AgendaDay, AvailabilitySlot, Appointment, Barber } from '@/types'

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(() => format(new Date(), 'yyyy-MM-dd'))
  const [selectedDay,  setSelectedDay]  = useState<AgendaDay | null>(null)
  const [dayLoading,   setDayLoading]   = useState(false)
  const [modalMode,    setModalMode]    = useState<AgendaModalMode>({ type: 'closed' })

  // Barbers
  const [barbers,          setBarbers]          = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>('')
  const [barbersReady,     setBarbersReady]     = useState(false)

  // Barber + barberMap for slot rows
  const barberMap   = new Map(barbers.map(b => [b.id, b.name]))
  const barberCount = barbers.length

  useEffect(() => {
    fetch('/api/barbers')
      .then(r => r.json())
      .then(data => {
        const list: Barber[] = data.barbers ?? []
        setBarbers(list)
        if (list.length > 0) setSelectedBarberId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setBarbersReady(true))
  }, [])

  // Fetch a single day's data
  const fetchDay = useCallback(async (date: string, barberId: string) => {
    if (!barberId) return
    setDayLoading(true)
    try {
      const res  = await fetch(`/api/admin/agenda?from=${date}&to=${date}&barber_id=${barberId}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      const days: AgendaDay[] = data.days ?? []
      setSelectedDay(days.find(d => d.date === date) ?? {
        date,
        slots: [],
        totalSlots: 0,
        confirmedCount: 0,
        blockedCount: 0,
        freeCount: 0,
      })
    } catch {
      setSelectedDay(null)
    } finally {
      setDayLoading(false)
    }
  }, [])

  // Fetch day when date or barber changes
  useEffect(() => {
    if (selectedDate && selectedBarberId) {
      fetchDay(selectedDate, selectedBarberId)
    }
  }, [selectedDate, selectedBarberId, fetchDay])

  function handleSelectDate(date: string) {
    setSelectedDate(date)
  }

  function handleBarberChange(id: string) {
    setSelectedBarberId(id)
    setSelectedDay(null)
  }

  function handleSuccess() {
    if (selectedDate && selectedBarberId) {
      fetchDay(selectedDate, selectedBarberId)
    }
  }

  const multiBarber = barbers.length > 1

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">

      {/* ── Barber selector (only when 2+ barbers) ── */}
      {barbersReady && multiBarber && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: '#7A7268' }}>
            Barbero
          </span>
          <div className="flex gap-2 flex-wrap">
            {barbers.map(b => (
              <button
                key={b.id}
                onClick={() => handleBarberChange(b.id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.08)',
                  color:           selectedBarberId === b.id ? '#0E0B08' : '#7A7268',
                  border:          `1px solid ${selectedBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.15)'}`,
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Calendar ── */}
      {barbersReady && selectedBarberId ? (
        <AdminCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          barberId={selectedBarberId}
        />
      ) : (
        <div
          className="rounded-2xl animate-pulse"
          style={{ height: 340, backgroundColor: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.06)' }}
        />
      )}

      {/* ── Day panel: appointments grid ── */}
      {barbersReady && (
        <AgendaDayPanel
          day={selectedDay}
          loading={dayLoading}
          onBlock={(slot: AvailabilitySlot) => setModalMode({ type: 'block-slot', slot })}
          onEditSlot={(slot: AvailabilitySlot) => setModalMode({ type: 'edit-slot-times', slot })}
          onCreateAppointment={(slot: AvailabilitySlot) => setModalMode({ type: 'create-appointment', slot })}
          onEditAppointment={(appointment: Appointment) => setModalMode({ type: 'edit-appointment', appointment })}
          onCancelAppointment={(appointment: Appointment) => setModalMode({ type: 'cancel-appointment', appointment })}
          onOpenBulkCreator={(date: string) => setModalMode({ type: 'bulk-creator', date })}
          onRescheduleAppointment={(appointment: Appointment) => setModalMode({ type: 'reschedule-appointment', appointment })}
          onMarkNoShow={(appointment: Appointment) => setModalMode({ type: 'mark-no-show', appointment })}
          onMarkCompleted={(appointment: Appointment) => setModalMode({ type: 'mark-completed', appointment })}
          onViewClientHistory={(appointment: Appointment) => setModalMode({ type: 'client-history', appointment })}
          barberMap={barberMap}
          barberCount={barberCount}
        />
      )}

      <AgendaModal
        mode={modalMode}
        onClose={() => setModalMode({ type: 'closed' })}
        onSuccess={handleSuccess}
        barberId={selectedBarberId}
      />
    </div>
  )
}
