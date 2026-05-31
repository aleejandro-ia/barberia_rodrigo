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
} from 'date-fns'
import { es } from 'date-fns/locale'

interface BookingCalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
// Show at most 3 months ahead — no point showing months with no slots
const MAX_MONTHS_AHEAD = 3

export default function BookingCalendar({
  selectedDate,
  onSelectDate,
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
    fetch(`/api/availability/dates?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.dates)) setAvailableDates(data.dates)
        else setAvailableDates([])
      })
      .catch(() => setAvailableDates([]))
      .finally(() => setLoading(false))
  }, [currentMonth])

  const today = startOfDay(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  /* Monday-first */
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7
  const paddingDays = Array.from({ length: firstDayOfWeek })

  const maxMonth = new Date(
    today.getFullYear(),
    today.getMonth() + MAX_MONTHS_AHEAD,
    1,
  )
  const canGoPrev =
    currentMonth.getTime() > new Date(today.getFullYear(), today.getMonth(), 1).getTime()
  const canGoNext = currentMonth.getTime() < maxMonth.getTime()

  return (
    <div
      className="w-full select-none rounded-[20px] p-6"
      style={{
        backgroundColor: '#F8F5F0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-7">
        <button
          onClick={() =>
            canGoPrev &&
            setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
          }
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            color: canGoPrev ? '#C9A96E' : '#C0B9AF',
            backgroundColor: canGoPrev ? 'rgba(201,169,110,0.1)' : 'transparent',
            border: `1px solid ${canGoPrev ? 'rgba(201,169,110,0.3)' : 'rgba(192,185,175,0.3)'}`,
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            opacity: canGoPrev ? 1 : 0.45,
          }}
          aria-label="Mes anterior"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        <div className="text-center">
          <p
            className="text-base font-semibold capitalize tracking-wide"
            style={{ color: '#1a1814' }}
          >
            {format(currentMonth, 'MMMM', { locale: es })}
          </p>
          <p className="text-sm mt-0.5" style={{ color: '#5A5550' }}>
            {format(currentMonth, 'yyyy')}
          </p>
        </div>

        <button
          onClick={() =>
            canGoNext &&
            setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
          }
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            color: canGoNext ? '#C9A96E' : '#C0B9AF',
            backgroundColor: canGoNext ? 'rgba(201,169,110,0.1)' : 'transparent',
            border: `1px solid ${canGoNext ? 'rgba(201,169,110,0.3)' : 'rgba(192,185,175,0.3)'}`,
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            opacity: canGoNext ? 1 : 0.45,
          }}
          aria-label="Mes siguiente"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-3">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-sm font-medium py-1"
            style={{ color: '#7A7268' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 relative">
        {loading && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(248,245,240,0.85)' }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'rgba(201,169,110,0.25)',
                borderTopColor: '#C9A96E',
              }}
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
              className="relative flex items-center justify-center text-base font-medium transition-all duration-150"
              style={{
                aspectRatio: '1',
                borderRadius: '10px',
                backgroundColor: isSelected
                  ? '#C9A96E'
                  : 'transparent',
                color: isSelected
                  ? '#0E0B08'
                  : isPast
                    ? '#C0B9AF'
                    : isAvailable
                      ? '#1a1814'
                      : '#C0B9AF',
                cursor: isClickable ? 'pointer' : 'default',
                border:
                  isToday && !isSelected
                    ? '1px solid rgba(201,169,110,0.6)'
                    : isSelected
                      ? '1px solid #C9A96E'
                      : '1px solid transparent',
                boxShadow: isSelected ? '0 2px 12px rgba(201,169,110,0.35)' : 'none',
              }}
              aria-label={`${dateStr}${isAvailable ? ' – disponible' : ''}`}
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

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
          <span className="text-sm" style={{ color: '#7A7268' }}>
            Disponible
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-[4px] flex-shrink-0"
            style={{ backgroundColor: '#C9A96E' }}
          />
          <span className="text-sm" style={{ color: '#7A7268' }}>
            Seleccionado
          </span>
        </div>
      </div>
    </div>
  )
}
