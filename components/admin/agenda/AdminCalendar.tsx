'use client'

import { useState, useEffect } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isBefore,
  startOfDay,
  isSameDay,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { AgendaDay } from '@/types'

interface AdminCalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
  barberId: string
}

const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

interface DaySummary {
  confirmedCount: number
  freeCount: number
  blockedCount: number
  totalSlots: number
}

export default function AdminCalendar({ selectedDate, onSelectDate, barberId }: AdminCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [daySummaries, setDaySummaries] = useState<Map<string, DaySummary>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!barberId) return
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const monthEnd   = format(endOfMonth(currentMonth),   'yyyy-MM-dd')
    setLoading(true)
    fetch(`/api/admin/agenda?from=${monthStart}&to=${monthEnd}&barber_id=${barberId}`)
      .then(r => r.json())
      .then((data: { days?: AgendaDay[] }) => {
        const map = new Map<string, DaySummary>()
        for (const day of data.days ?? []) {
          map.set(day.date, {
            confirmedCount: day.confirmedCount,
            freeCount:      day.freeCount,
            blockedCount:   day.blockedCount,
            totalSlots:     day.totalSlots,
          })
        }
        setDaySummaries(map)
      })
      .catch(() => setDaySummaries(new Map()))
      .finally(() => setLoading(false))
  }, [currentMonth, barberId])

  const today         = startOfDay(new Date())
  const monthStart    = startOfMonth(currentMonth)
  const monthEnd      = endOfMonth(currentMonth)
  const days          = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7
  const paddingDays   = Array.from({ length: firstDayOfWeek })

  const canGoPrev = true  // admin can view past months
  const canGoNext = true

  return (
    <div
      className="rounded-2xl p-5 select-none w-full"
      style={{ backgroundColor: '#F8F5F0' }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="flex items-center justify-center transition-all duration-150"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid rgba(201,169,110,0.2)',
            color: '#C9A96E', backgroundColor: 'transparent', cursor: 'pointer',
          }}
          aria-label="Mes anterior"
        >
          <CaretLeft size={13} weight="bold" />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold capitalize tracking-wide" style={{ color: '#1A1512' }}>
            {format(currentMonth, 'MMMM', { locale: es })}
          </p>
          <p className="text-sm mt-0.5" style={{ color: '#7A7068' }}>
            {format(currentMonth, 'yyyy')}
          </p>
        </div>

        <button
          onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="flex items-center justify-center transition-all duration-150"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid rgba(201,169,110,0.2)',
            color: '#C9A96E', backgroundColor: 'transparent', cursor: 'pointer',
          }}
          aria-label="Mes siguiente"
        >
          <CaretRight size={13} weight="bold" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center py-1"
            style={{ color: '#8A8078', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 relative">
        {loading && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(248,245,240,0.85)' }}>
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.25)', borderTopColor: '#C9A96E' }} />
          </div>
        )}

        {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}

        {days.map(day => {
          const dateStr   = format(day, 'yyyy-MM-dd')
          const summary   = daySummaries.get(dateStr)
          const isPast    = isBefore(startOfDay(day), today)
          const isSelected = selectedDate === dateStr
          const isToday   = isSameDay(day, today)
          const hasSlots  = summary && summary.totalSlots > 0
          const hasConfirmed = summary && summary.confirmedCount > 0
          const hasFree      = summary && summary.freeCount > 0

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className="relative flex flex-col items-center justify-center text-sm font-medium transition-all duration-150 active:scale-[0.95]"
              style={{
                aspectRatio: '1',
                minHeight: '40px',
                borderRadius: '10px',
                backgroundColor: isSelected ? '#C9A96E' : 'transparent',
                color: isSelected
                  ? '#0E0B08'
                  : isPast
                    ? '#C8C0B8'
                    : hasSlots
                      ? '#1A1512'
                      : '#A8A098',
                cursor: 'pointer',
                border: isToday && !isSelected
                  ? '1px solid rgba(201,169,110,0.4)'
                  : isSelected
                    ? '1px solid #C9A96E'
                    : '1px solid transparent',
                boxShadow: isSelected ? '0 2px 12px rgba(201,169,110,0.3)' : 'none',
              }}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              {format(day, 'd')}
              {/* Dots: confirmed = green, free = gold */}
              {hasSlots && !isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasConfirmed && (
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
                  )}
                  {hasFree && (
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>Citas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
          <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>Huecos libres</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-[4px]" style={{ backgroundColor: '#C9A96E' }} />
          <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>Seleccionado</span>
        </div>
      </div>
    </div>
  )
}
