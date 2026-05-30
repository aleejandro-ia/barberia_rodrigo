'use client'

import { useState, useEffect } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface BookingCalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function BookingCalendar({ selectedDate, onSelectDate }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const monthStr = format(currentMonth, 'yyyy-MM')
    setLoading(true)
    fetch(`/api/availability/dates?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.dates)) {
          setAvailableDates(data.dates)
        } else {
          setAvailableDates([])
        }
      })
      .catch(() => setAvailableDates([]))
      .finally(() => setLoading(false))
  }, [currentMonth])

  const today = startOfDay(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Monday-first: getDay() returns 0=Sun, convert to Mon=0
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7
  const paddingDays = Array.from({ length: firstDayOfWeek })

  function prevMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-2 rounded-full transition-colors disabled:opacity-30"
          style={{ color: canGoPrev ? '#C9A96E' : '#444' }}
          aria-label="Mes anterior"
        >
          <CaretLeft size={18} weight="bold" />
        </button>

        <span
          className="text-base font-semibold capitalize"
          style={{ color: '#F5F5F5' }}
        >
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>

        <button
          onClick={nextMonth}
          className="p-2 rounded-full transition-colors"
          style={{ color: '#C9A96E' }}
          aria-label="Mes siguiente"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium py-1"
            style={{ color: '#555' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 relative">
        {loading && (
          <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(10,10,10,0.6)' }}>
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isPast = isBefore(startOfDay(day), today)
          const isAvailable = availableDates.includes(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = isSameDay(day, today)

          const isClickable = isAvailable && !isPast

          return (
            <button
              key={dateStr}
              onClick={() => isClickable && onSelectDate(dateStr)}
              disabled={!isClickable}
              className="aspect-square rounded-lg text-sm font-medium transition-all duration-150 relative flex items-center justify-center"
              style={{
                backgroundColor: isSelected
                  ? '#C9A96E'
                  : isAvailable && !isPast
                  ? 'rgba(201,169,110,0.08)'
                  : 'transparent',
                color: isSelected
                  ? '#0A0A0A'
                  : isPast
                  ? '#333'
                  : isAvailable
                  ? '#F5F5F5'
                  : '#444',
                cursor: isClickable ? 'pointer' : 'default',
                border: isToday && !isSelected ? '1px solid rgba(201,169,110,0.4)' : '1px solid transparent',
              }}
              aria-label={`${dateStr}${isAvailable ? ' - disponible' : ''}`}
              aria-pressed={isSelected}
            >
              {format(day, 'd')}
              {isAvailable && !isPast && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: '#C9A96E' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
