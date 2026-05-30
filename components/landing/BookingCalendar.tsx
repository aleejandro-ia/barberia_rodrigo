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

  const canGoPrev =
    currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)

  return (
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-7">
        <button
          onClick={() =>
            canGoPrev &&
            setCurrentMonth(
              (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
            )
          }
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 disabled:opacity-20"
          style={{
            color: canGoPrev ? '#C9A96E' : '#444',
            backgroundColor: canGoPrev
              ? 'rgba(201,169,110,0.08)'
              : 'transparent',
            border: '1px solid rgba(201,169,110,0.15)',
          }}
          aria-label="Mes anterior"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        <div className="text-center">
          <p
            className="text-sm font-semibold capitalize tracking-wide"
            style={{ color: '#F5F5F5' }}
          >
            {format(currentMonth, 'MMMM', { locale: es })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>
            {format(currentMonth, 'yyyy')}
          </p>
        </div>

        <button
          onClick={() =>
            setCurrentMonth(
              (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
            )
          }
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            color: '#C9A96E',
            backgroundColor: 'rgba(201,169,110,0.08)',
            border: '1px solid rgba(201,169,110,0.15)',
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
            className="text-center text-xs font-medium py-1"
            style={{ color: '#444' }}
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
            style={{ backgroundColor: 'rgba(10,10,10,0.7)' }}
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
              className="relative flex items-center justify-center text-sm font-medium transition-all duration-150"
              style={{
                aspectRatio: '1',
                borderRadius: '10px',
                backgroundColor: isSelected
                  ? '#C9A96E'
                  : isAvailable && !isPast
                    ? 'rgba(201,169,110,0.1)'
                    : 'transparent',
                color: isSelected
                  ? '#0A0A0A'
                  : isPast
                    ? '#2A2A2A'
                    : isAvailable
                      ? '#F5F5F5'
                      : '#3A3A3A',
                cursor: isClickable ? 'pointer' : 'default',
                border:
                  isToday && !isSelected
                    ? '1px solid rgba(201,169,110,0.5)'
                    : isSelected
                      ? '1px solid #C9A96E'
                      : '1px solid transparent',
                boxShadow: isSelected
                  ? '0 0 12px rgba(201,169,110,0.25)'
                  : 'none',
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
          <span className="text-xs" style={{ color: '#555' }}>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#C9A96E', boxShadow: '0 0 6px rgba(201,169,110,0.5)' }}
          />
          <span className="text-xs" style={{ color: '#555' }}>Seleccionado</span>
        </div>
      </div>
    </div>
  )
}
