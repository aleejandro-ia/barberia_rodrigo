'use client'

import { addDays, parseISO, format } from 'date-fns'
import DayCard from './DayCard'
import type { AgendaDay } from '@/types'

interface AgendaWeekGridProps {
  weekStart:    string     // 'YYYY-MM-DD' Monday
  days:         AgendaDay[]
  selectedDate: string | null
  onSelectDay:  (date: string) => void
  loading:      boolean
}

export default function AgendaWeekGrid({
  weekStart,
  days,
  selectedDate,
  onSelectDay,
  loading,
}: AgendaWeekGridProps) {
  // Build 7-day array from weekStart (Mon→Sun)
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) =>
    format(addDays(parseISO(weekStart), i), 'yyyy-MM-dd')
  )

  // Build a map of date → AgendaDay for fast lookup
  const dayMap = new Map(days.map((d) => [d.date, d]))

  return (
    <div
      className="overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(7, minmax(72px, 1fr))', minWidth: 520 }}
      >
        {weekDates.map((date) => {
          if (loading) {
            return (
              <div
                key={date}
                className="rounded-xl animate-pulse"
                style={{ height: 110, backgroundColor: 'rgba(201,169,110,0.05)' }}
              />
            )
          }

          const day: AgendaDay = dayMap.get(date) ?? {
            date,
            slots:          [],
            totalSlots:     0,
            confirmedCount: 0,
            blockedCount:   0,
            freeCount:      0,
          }

          return (
            <DayCard
              key={date}
              day={day}
              isSelected={selectedDate === date}
              onClick={onSelectDay}
            />
          )
        })}
      </div>
    </div>
  )
}
