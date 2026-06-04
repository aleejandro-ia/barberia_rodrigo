'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, isBefore, startOfDay } from 'date-fns'
import type { AgendaDay } from '@/types'
import PremiumCalendar, { type DayMeta } from '@/components/shared/PremiumCalendar'

interface AdminCalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
  barberId: string
}

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
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    setLoading(true)
    fetch(`/api/admin/agenda?from=${monthStart}&to=${monthEnd}&barber_id=${barberId}`)
      .then((r) => r.json())
      .then((data: { days?: AgendaDay[] }) => {
        const map = new Map<string, DaySummary>()
        for (const day of data.days ?? []) {
          map.set(day.date, {
            confirmedCount: day.confirmedCount,
            freeCount: day.freeCount,
            blockedCount: day.blockedCount,
            totalSlots: day.totalSlots,
          })
        }
        setDaySummaries(map)
      })
      .catch(() => setDaySummaries(new Map()))
      .finally(() => setLoading(false))
  }, [currentMonth, barberId])

  const today = startOfDay(new Date())

  // Admin can navigate any month (no forward cap, but no past months before current)
  const canGoPrev =
    currentMonth.getTime() > new Date(2020, 0, 1).getTime()
  const canGoNext = true

  const getDayMeta = (dateStr: string, day: Date): DayMeta => {
    const summary = daySummaries.get(dateStr)
    const isPast = isBefore(startOfDay(day), today)
    const hasSlots = !!summary && summary.totalSlots > 0
    return {
      // Admin can always click a day (to view / create), never disabled
      disabled: false,
      dimmed: isPast || !hasSlots,
    }
  }

  const renderDot = (dateStr: string) => {
    const summary = daySummaries.get(dateStr)
    if (!summary || summary.totalSlots === 0) return null
    const hasConfirmed = summary.confirmedCount > 0
    const hasFree = summary.freeCount > 0
    return (
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
        {hasConfirmed && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#4ADE80' }} />}
        {hasFree && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#C9A96E' }} />}
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4 w-full max-w-sm" style={{ backgroundColor: '#F8F5F0' }}>
      <PremiumCalendar
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        loading={loading}
        getDayMeta={getDayMeta}
        renderDot={renderDot}
        legend={
          <>
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
          </>
        }
      />
    </div>
  )
}
