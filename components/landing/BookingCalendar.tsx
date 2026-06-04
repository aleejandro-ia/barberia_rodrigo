'use client'

import { useState, useEffect } from 'react'
import { format, isBefore, startOfDay } from 'date-fns'
import PremiumCalendar, { type DayMeta } from '@/components/shared/PremiumCalendar'

interface BookingCalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
  barberId?: string
}

// Show at most 3 months ahead — no point showing months with no slots
const MAX_MONTHS_AHEAD = 3

export default function BookingCalendar({
  selectedDate,
  onSelectDate,
  barberId,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const monthStr = format(currentMonth, 'yyyy-MM')
    setLoading(true)
    const url = barberId
      ? `/api/availability/dates?month=${monthStr}&barber_id=${barberId}`
      : `/api/availability/dates?month=${monthStr}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.dates)) setAvailableDates(data.dates)
        else setAvailableDates([])
      })
      .catch(() => setAvailableDates([]))
      .finally(() => setLoading(false))
  }, [currentMonth, barberId])

  const today = startOfDay(new Date())
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD, 1)
  const canGoPrev =
    currentMonth.getTime() > new Date(today.getFullYear(), today.getMonth(), 1).getTime()
  const canGoNext = currentMonth.getTime() < maxMonth.getTime()

  const getDayMeta = (dateStr: string, day: Date): DayMeta => {
    const isPast = isBefore(startOfDay(day), today)
    const isAvailable = availableDates.includes(dateStr)
    return {
      disabled: !isAvailable || isPast,
      dimmed: isPast,
    }
  }

  const renderDot = (dateStr: string) => {
    const day = new Date(dateStr + 'T00:00:00')
    const isPast = isBefore(startOfDay(day), today)
    if (!availableDates.includes(dateStr) || isPast) return null
    return (
      <span
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
        style={{ backgroundColor: '#C9A96E' }}
      />
    )
  }

  return (
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
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
            <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[4px] flex-shrink-0" style={{ backgroundColor: '#C9A96E' }} />
            <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>Seleccionado</span>
          </div>
        </>
      }
    />
  )
}
