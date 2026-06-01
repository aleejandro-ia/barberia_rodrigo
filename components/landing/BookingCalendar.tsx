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
  barberId?: string
}

const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
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
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() =>
            canGoPrev &&
            setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
          }
          disabled={!canGoPrev}
          className="flex items-center justify-center transition-all duration-150"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `1px solid ${canGoPrev ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.07)'}`,
            color: canGoPrev ? '#C9A96E' : '#3A3530',
            backgroundColor: 'transparent',
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            opacity: canGoPrev ? 1 : 0.4,
          }}
          aria-label="Mes anterior"
        >
          <CaretLeft size={13} weight="bold" />
        </button>

        <div className="text-center">
          <p
            className="text-base font-semibold capitalize tracking-wide"
            style={{ color: '#F2EDE7' }}
          >
            {format(currentMonth, 'MMMM', { locale: es })}
          </p>
          <p className="text-sm mt-0.5" style={{ color: '#5A5450' }}>
            {format(currentMonth, 'yyyy')}
          </p>
        </div>

        <button
          onClick={() =>
            canGoNext &&
            setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
          }
          disabled={!canGoNext}
          className="flex items-center justify-center transition-all duration-150"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `1px solid ${canGoNext ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.07)'}`,
            color: canGoNext ? '#C9A96E' : '#3A3530',
            backgroundColor: 'transparent',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            opacity: canGoNext ? 1 : 0.4,
          }}
          aria-label="Mes siguiente"
        >
          <CaretRight size={13} weight="bold" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center py-1"
            style={{ color: '#4A4540', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}
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
            style={{ backgroundColor: 'rgba(22,19,16,0.85)' }}
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
              className="relative flex items-center justify-center text-sm font-medium transition-all duration-150 active:scale-[0.95]"
              style={{
                aspectRatio: '1',
                minHeight: '40px',
                borderRadius: '10px',
                backgroundColor: isSelected
                  ? '#C9A96E'
                  : 'transparent',
                color: isSelected
                  ? '#0E0B08'
                  : isPast
                    ? '#2A2520'
                    : isAvailable
                      ? '#F2EDE7'
                      : '#3A3530',
                cursor: isClickable ? 'pointer' : 'default',
                border:
                  isToday && !isSelected
                    ? '1px solid rgba(201,169,110,0.4)'
                    : isSelected
                      ? '1px solid #C9A96E'
                      : '1px solid transparent',
                boxShadow: isSelected ? '0 2px 12px rgba(201,169,110,0.3)' : 'none',
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

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
          <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>
            Disponible
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3.5 h-3.5 rounded-[4px] flex-shrink-0"
            style={{ backgroundColor: '#C9A96E' }}
          />
          <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>
            Seleccionado
          </span>
        </div>
      </div>
    </div>
  )
}
