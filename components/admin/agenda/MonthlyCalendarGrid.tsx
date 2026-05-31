'use client'

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns'
import type { AgendaDay } from '@/types'

const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface MonthlyCalendarGridProps {
  days:         AgendaDay[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
  currentMonth: Date
}

export default function MonthlyCalendarGrid({
  days,
  selectedDate,
  onSelectDate,
  currentMonth,
}: MonthlyCalendarGridProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd,    { weekStartsOn: 1 })
  const allDays    = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
    >
      <div className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-xs py-2 font-medium"
              style={{ color: '#7A7268' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {allDays.map((day) => {
            const dateStr        = format(day, 'yyyy-MM-dd')
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const agendaDay      = isCurrentMonth ? days.find((d) => d.date === dateStr) : undefined
            const isSelected     = isCurrentMonth && selectedDate === dateStr
            const isTodayDate    = isToday(day)
            const hasBookings    = !!agendaDay && agendaDay.confirmedCount > 0
            const count          = agendaDay?.confirmedCount ?? 0

            const numColor = isSelected
              ? '#F2EDE7'
              : hasBookings
              ? '#F2EDE7'
              : '#4A4540'

            return (
              <button
                key={dateStr}
                onClick={() => isCurrentMonth && onSelectDate(dateStr)}
                disabled={!isCurrentMonth}
                className="relative flex flex-col items-center justify-start pt-2 pb-1.5 rounded-xl transition-colors"
                style={{
                  minHeight:       '44px',
                  backgroundColor: isSelected ? 'rgba(201,169,110,0.08)' : 'transparent',
                  border:          isSelected ? '1px solid #C9A96E' : '1px solid transparent',
                  cursor:          isCurrentMonth ? 'pointer' : 'default',
                  opacity:         isCurrentMonth ? 1 : 0.3,
                }}
                onMouseEnter={(e) => {
                  if (isCurrentMonth && !isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isCurrentMonth && !isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {/* Day number */}
                <span
                  className="text-sm font-medium leading-none"
                  style={{ color: numColor }}
                >
                  {format(day, 'd')}
                </span>

                {/* Bottom indicator row: today dot OR booking dot+count */}
                <span className="mt-0.5 flex items-center gap-0.5 h-2">
                  {isTodayDate && !hasBookings && (
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: '#C9A96E' }}
                    />
                  )}
                  {hasBookings && (
                    <>
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: '#C9A96E' }}
                      />
                      {count > 1 && (
                        <span
                          className="text-[9px] font-semibold leading-none"
                          style={{ color: '#C9A96E' }}
                        >
                          {count}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
