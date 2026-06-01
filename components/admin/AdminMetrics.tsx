'use client'

import { useEffect, useState } from 'react'
import type { Barber } from '@/types'

interface MetricsData {
  today: {
    confirmed: number
    completed: number
    noShow:    number
  }
  thisWeek: {
    confirmed: number
    completed: number
    cancelled: number
    noShow:    number
  }
  upcoming7days: number
  freeSlots7days: number
  occupancyRate:  number
  topClients: { name: string; phone: string; count: number }[]
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
    >
      <p className="text-2xl font-bold tabular-nums" style={{ color: '#C9A96E' }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: '#7A7268' }}>{label}</p>
      {sub && <p className="text-xs" style={{ color: '#3A3530' }}>{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 animate-pulse"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.06)' }}
    >
      <div className="h-7 w-10 rounded mb-2" style={{ backgroundColor: 'rgba(201,169,110,0.08)' }} />
      <div className="h-3 w-20 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

export default function AdminMetrics() {
  const [data,    setData]    = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  // Barbers + selection — metrics are filtered per barber
  const [barbers,          setBarbers]          = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>('')
  const [barbersReady,     setBarbersReady]     = useState(false)

  useEffect(() => {
    fetch('/api/barbers')
      .then(r => r.json())
      .then(d => {
        const list: Barber[] = d.barbers ?? []
        setBarbers(list)
        if (list.length > 0) setSelectedBarberId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setBarbersReady(true))
  }, [])

  useEffect(() => {
    // Wait until barbers resolved; fall back to global metrics if none exist
    if (!barbersReady) return
    const url = selectedBarberId
      ? `/api/admin/metrics?barber_id=${selectedBarberId}`
      : '/api/admin/metrics'
    fetch(url)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [barbersReady, selectedBarberId])

  if (error) return null

  const multiBarber = barbers.length > 1

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4A4540' }}>
          Métricas
        </p>
        {multiBarber && (
          <div className="flex gap-2 flex-wrap">
            {barbers.map(b => (
              <button
                key={b.id}
                onClick={() => { if (b.id !== selectedBarberId) { setLoading(true); setSelectedBarberId(b.id) } }}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
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
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data ? (
        <div className="flex flex-col gap-4">
          {/* Main metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard label="Citas hoy"          value={data.today.confirmed} />
            <MetricCard label="Completadas hoy"    value={data.today.completed} />
            <MetricCard label="No-shows hoy"       value={data.today.noShow} />
            <MetricCard label="Esta semana"        value={data.thisWeek.confirmed} sub={`${data.thisWeek.completed} completadas`} />
            <MetricCard label="Huecos libres (7d)" value={data.freeSlots7days} />
            <MetricCard label="Ocupación (30d)"    value={`${data.occupancyRate}%`} />
          </div>

          {/* Top clients */}
          {data.topClients.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
            >
              <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#4A4540' }}>
                Top clientes (30 días)
              </p>
              <div className="flex flex-col gap-1.5">
                {data.topClients.map((client, i) => (
                  <div key={client.phone} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums w-4 text-right" style={{ color: '#3A3530' }}>
                        {i + 1}.
                      </span>
                      <span className="text-sm font-medium" style={{ color: '#F2EDE7' }}>
                        {client.name}
                      </span>
                      <span className="text-xs" style={{ color: '#4A4540' }}>
                        {client.phone}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(201,169,110,0.1)',
                        color:           '#C9A96E',
                        border:          '1px solid rgba(201,169,110,0.2)',
                      }}
                    >
                      {client.count} visita{client.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
