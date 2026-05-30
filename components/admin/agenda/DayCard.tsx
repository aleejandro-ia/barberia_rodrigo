'use client'

import { format, parseISO, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AgendaDay } from '@/types'

interface DayCardProps {
  day:        AgendaDay
  isSelected: boolean
  onClick:    (date: string) => void
}

export default function DayCard({ day, isSelected, onClick }: DayCardProps) {
  const date    = parseISO(day.date)
  const today   = isToday(date)
  const dayName = format(date, 'EEE', { locale: es })  // Lun, Mar…
  const dayNum  = format(date, 'd')

  const isEmpty = day.totalSlots === 0

  return (
    <button
      onClick={() => onClick(day.date)}
      className="flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-150 w-full text-left"
      style={{
        backgroundColor: isSelected ? 'rgba(201,169,110,0.08)' : '#161310',
        border:          isSelected
          ? '1px solid rgba(201,169,110,0.35)'
          : '1px solid rgba(201,169,110,0.1)',
        outline: 'none',
        cursor:  'pointer',
      }}
    >
      {/* Day name */}
      <span
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: today ? '#C9A96E' : '#4A4540' }}
      >
        {dayName}
      </span>

      {/* Day number */}
      <span
        className="text-xl font-bold leading-none"
        style={{
          color: today ? '#C9A96E' : isSelected ? '#F2EDE7' : '#7A7268',
        }}
      >
        {dayNum}
      </span>

      {/* Today dot */}
      {today && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: '#C9A96E' }}
        />
      )}

      {/* Slot summary dots */}
      {!isEmpty ? (
        <div className="flex flex-col gap-0.5 w-full mt-1">
          {day.confirmedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#4ADE80' }} />
              <span className="text-xs" style={{ color: '#4ADE80' }}>{day.confirmedCount}</span>
            </div>
          )}
          {day.freeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(201,169,110,0.5)' }} />
              <span className="text-xs" style={{ color: 'rgba(201,169,110,0.5)' }}>{day.freeCount}</span>
            </div>
          )}
          {day.blockedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#3A3530' }} />
              <span className="text-xs" style={{ color: '#3A3530' }}>{day.blockedCount}</span>
            </div>
          )}
        </div>
      ) : (
        <span className="text-xs mt-1" style={{ color: '#2A2520' }}>—</span>
      )}
    </button>
  )
}
