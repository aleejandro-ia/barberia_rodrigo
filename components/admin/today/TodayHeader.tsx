'use client'

import { CalendarCheck, CheckCircle, UserMinus, Scissors, CurrencyEur, ArrowsClockwise } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Barber } from '@/types'
import type { DayStats } from '@/lib/today'

interface TodayHeaderProps {
  greeting: string
  date: string                 // 'YYYY-MM-DD'
  stats: DayStats | null
  barbers: Barber[]
  selectedBarberId: string     // '' = Todos
  onBarberChange: (id: string) => void
  onRefresh: () => void
  refreshing?: boolean
}

function StatChip({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl flex-shrink-0"
      style={{ backgroundColor: `${color}12`, border: `1px solid ${color}26` }}
    >
      <span style={{ color }}>{icon}</span>
      <div className="leading-none">
        <p className="font-bold tabular-nums" style={{ color: '#F2EDE7', fontSize: '1.05rem' }}>{value}</p>
        <p className="uppercase tracking-[0.12em] mt-0.5" style={{ color: '#7A7268', fontSize: '0.6rem' }}>{label}</p>
      </div>
    </div>
  )
}

export default function TodayHeader({
  greeting, date, stats, barbers, selectedBarberId, onBarberChange, onRefresh, refreshing,
}: TodayHeaderProps) {
  const dateLabel = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })
  const multiBarber = barbers.length > 1

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting + date + refresh */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1
            className="font-semibold leading-tight"
            style={{ color: '#F2EDE7', fontFamily: 'var(--font-serif)', fontSize: '1.7rem' }}
          >
            {greeting}
          </h1>
          <p className="mt-1 capitalize" style={{ color: '#7A7268', fontSize: '0.9rem' }}>{dateLabel}</p>
        </div>
        <button
          onClick={onRefresh}
          aria-label="Actualizar"
          className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all"
          style={{ color: '#C9A96E', backgroundColor: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)' }}
        >
          <ArrowsClockwise size={18} weight="bold" className={refreshing ? 'animate-spin' : undefined} />
        </button>
      </div>

      {/* Stat chips — horizontal scroll on mobile, no overlap */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        <StatChip icon={<CalendarCheck size={20} weight="duotone" />} label="Citas" value={String(stats?.confirmedCount ?? 0)} color="#4ADE80" />
        <StatChip icon={<CheckCircle size={20} weight="duotone" />} label="Hechas" value={String(stats?.completedCount ?? 0)} color="#C9A96E" />
        <StatChip icon={<UserMinus size={20} weight="duotone" />} label="No-show" value={String(stats?.noShowCount ?? 0)} color="#EF4444" />
        <StatChip icon={<Scissors size={20} weight="duotone" />} label="Libres" value={String(stats?.freeCount ?? 0)} color="#8A8078" />
        <StatChip
          icon={<CurrencyEur size={20} weight="duotone" />}
          label={stats?.revenuePartial ? '≈ Estim.' : 'Estim.'}
          value={`${stats?.revenueEur ?? 0}€`}
          color="#C9A96E"
        />
      </div>

      {/* Barber selector (only when 2+ barbers) — includes "Todos" */}
      {multiBarber && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onBarberChange('')}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: selectedBarberId === '' ? '#C9A96E' : 'rgba(201,169,110,0.08)',
              color:           selectedBarberId === '' ? '#0E0B08' : '#7A7268',
              border:          `1px solid ${selectedBarberId === '' ? '#C9A96E' : 'rgba(201,169,110,0.15)'}`,
            }}
          >
            Todos
          </button>
          {barbers.map((b) => (
            <button
              key={b.id}
              onClick={() => onBarberChange(b.id)}
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
      )}
    </div>
  )
}
