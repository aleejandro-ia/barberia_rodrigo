'use client'

import { useEffect, useState } from 'react'
import AppointmentsList from '@/components/admin/AppointmentsList'
import AdminMetrics from '@/components/admin/AdminMetrics'
import type { Appointment } from '@/types'

type Filter = 'today' | 'upcoming' | 'all'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'upcoming', label: 'Próximas' },
  { key: 'all', label: 'Todas' },
]

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
      if (!res.ok) throw new Error('Error')
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

  return (
    <div>
      {/* Metrics */}
      <AdminMetrics />

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
            Panel Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
            Citas
          </h1>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full" style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.08)' }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: filter === f.key ? '#C9A96E' : 'transparent',
                color: filter === f.key ? '#0E0B08' : '#7A7268',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
          />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-sm" style={{ color: '#FF8080' }}>{error}</div>
      ) : (
        <AppointmentsList appointments={appointments} onRefresh={fetchAppointments} />
      )}
    </div>
  )
}
