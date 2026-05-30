'use client'

import { useEffect, useState } from 'react'
import AppointmentsList from '@/components/admin/AppointmentsList'
import { Button } from '@/components/ui/button'
import type { Appointment } from '@/types'

type Filter = 'today' | 'upcoming' | 'all'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchAppointments() {
    setLoading(true)
    setError(null)
    try {
      const today = todayStr()
      let url = '/api/admin/appointments'
      if (filter === 'today') url += `?date=${today}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error cargando citas')
      const data = await res.json()
      let appts: Appointment[] = data.appointments ?? []
      if (filter === 'upcoming') {
        appts = appts.filter((a) => a.slot_date >= today)
      }
      setAppointments(appts)
    } catch {
      setError('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const filters: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'upcoming', label: 'Próximas' },
    { key: 'all', label: 'Todas' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Citas</h1>
        <div className="flex gap-1">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-500">Cargando…</div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : (
        <AppointmentsList appointments={appointments} onRefresh={fetchAppointments} />
      )}
    </div>
  )
}
