'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import TodayHeader from '@/components/admin/today/TodayHeader'
import NowNextCard from '@/components/admin/today/NowNextCard'
import TodayTimeline from '@/components/admin/today/TodayTimeline'
import AgendaModal, { type AgendaModalMode } from '@/components/admin/agenda/AgendaModal'
import { greeting, madridTodayISO, classifyDay, computeDayStats } from '@/lib/today'
import type { AgendaDay, AvailabilitySlot, Appointment, Barber, Service } from '@/types'

const REFRESH_MS = 60_000

export default function TodayPage() {
  const [today]        = useState<string>(() => madridTodayISO())
  const [day,          setDay]          = useState<AgendaDay | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [modalMode,    setModalMode]    = useState<AgendaModalMode>({ type: 'closed' })

  // Live clock — re-render every minute so "now / next" stays accurate
  const [nowMs, setNowMs] = useState<number>(() => Date.now())

  // Barbers + services
  const [barbers,          setBarbers]          = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>('') // '' = Todos
  const [services,         setServices]         = useState<Service[]>([])

  const barberMap   = useMemo(() => new Map(barbers.map((b) => [b.id, b.name])), [barbers])
  const barberCount = barbers.length

  /* ── Initial: barbers + services ── */
  useEffect(() => {
    fetch('/api/barbers').then((r) => r.json()).then((d) => setBarbers(d.barbers ?? [])).catch(() => {})
    fetch('/api/services').then((r) => r.json()).then((d) => setServices(d.services ?? [])).catch(() => {})
  }, [])

  /* ── Fetch today's data ── */
  const fetchDay = useCallback(async (barberId: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const qs  = `from=${today}&to=${today}${barberId ? `&barber_id=${barberId}` : ''}`
      const res = await fetch(`/api/admin/agenda?${qs}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      const days: AgendaDay[] = data.days ?? []
      setDay(days.find((d) => d.date === today) ?? {
        date: today, slots: [], totalSlots: 0, confirmedCount: 0, blockedCount: 0, freeCount: 0,
      })
    } catch {
      setDay(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [today])

  useEffect(() => { fetchDay(selectedBarberId) }, [selectedBarberId, fetchDay])

  /* ── Auto-refresh: clock + data every minute ── */
  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now())
      fetchDay(selectedBarberId, true)
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [selectedBarberId, fetchDay])

  const classification = useMemo(() => classifyDay(day?.slots ?? [], nowMs), [day, nowMs])
  const stats          = useMemo(() => (day ? computeDayStats(day.slots, services) : null), [day, services])

  function handleSuccess() { fetchDay(selectedBarberId, true); setNowMs(Date.now()) }
  function handleRefresh() { fetchDay(selectedBarberId, true); setNowMs(Date.now()) }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6 flex flex-col gap-6">
      <TodayHeader
        greeting={greeting(nowMs)}
        date={today}
        stats={stats}
        barbers={barbers}
        selectedBarberId={selectedBarberId}
        onBarberChange={setSelectedBarberId}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <NowNextCard
        classification={classification}
        date={today}
        totalConfirmed={classification.confirmed.length}
      />

      <TodayTimeline
        day={day}
        loading={loading}
        nowMs={nowMs}
        barberMap={barberMap}
        barberCount={barberCount}
        onBlock={(slot: AvailabilitySlot) => setModalMode({ type: 'block-slot', slot })}
        onEditSlot={(slot: AvailabilitySlot) => setModalMode({ type: 'edit-slot-times', slot })}
        onCreateAppointment={(slot: AvailabilitySlot) => setModalMode({ type: 'create-appointment', slot })}
        onEditAppointment={(appointment: Appointment) => setModalMode({ type: 'edit-appointment', appointment })}
        onCancelAppointment={(appointment: Appointment) => setModalMode({ type: 'cancel-appointment', appointment })}
        onRescheduleAppointment={(appointment: Appointment) => setModalMode({ type: 'reschedule-appointment', appointment })}
        onMarkNoShow={(appointment: Appointment) => setModalMode({ type: 'mark-no-show', appointment })}
        onMarkCompleted={(appointment: Appointment) => setModalMode({ type: 'mark-completed', appointment })}
        onViewClientHistory={(appointment: Appointment) => setModalMode({ type: 'client-history', appointment })}
      />

      <AgendaModal
        mode={modalMode}
        onClose={() => setModalMode({ type: 'closed' })}
        onSuccess={handleSuccess}
        barberId={selectedBarberId}
      />
    </div>
  )
}
