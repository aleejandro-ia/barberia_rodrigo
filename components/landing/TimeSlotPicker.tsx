'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowClockwise } from '@phosphor-icons/react'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

interface TimeSlotPickerProps {
  date: string
  selectedSlot: Slot | null
  onSelectSlot: (slot: Slot) => void
  refreshKey?: number        // increment from parent to force re-fetch (e.g. after SLOT_TAKEN)
  minHoursAdvance?: number   // client-side filter: hide slots within this many hours (default: 2)
}

export default function TimeSlotPicker({
  date,
  selectedSlot,
  onSelectSlot,
  refreshKey = 0,
  minHoursAdvance = 2,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  const fetchSlots = () => {
    if (!date) return
    setLoading(true)
    setFetchError(false)
    setSlots([])
    fetch(`/api/availability/slots?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.slots)) setSlots(data.slots)
        else setSlots([])
      })
      .catch(() => { setSlots([]); setFetchError(true) })
      .finally(() => setLoading(false))
  }

  // Re-fetch when date changes or when parent increments refreshKey
  useEffect(() => {
    fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, refreshKey])

  const dateLabel = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="w-full">
      <p className="text-base mb-4 capitalize" style={{ color: '#888888' }}>
        {dateLabel}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
          />
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-base" style={{ color: '#888' }}>
            No se pudieron cargar los horarios.
          </p>
          <button
            onClick={fetchSlots}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: '#C9A96E' }}
          >
            <ArrowClockwise size={14} weight="bold" />
            Reintentar
          </button>
        </div>
      ) : (
        (() => {
          const now = Date.now()
          const visibleSlots = slots.filter((slot) => {
            if (!minHoursAdvance) return true
            const slotDT = new Date(`${date}T${slot.start_time}`).getTime()
            return (slotDT - now) / (1000 * 60 * 60) >= minHoursAdvance
          })

          if (visibleSlots.length === 0) return (
            <p className="text-base py-6 text-center" style={{ color: '#555' }}>
              No hay horarios disponibles para este día
            </p>
          )

          return (
            <div className="flex flex-col gap-2">
              {visibleSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id
                const start = slot.start_time.slice(0, 5)
                const end   = slot.end_time.slice(0, 5)
                return (
                  <button
                    key={slot.id}
                    onClick={() => onSelectSlot(slot)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all duration-150 active:scale-[0.98]"
                    style={{
                      backgroundColor: isSelected ? '#C9A96E' : 'rgba(201,169,110,0.07)',
                      color:           isSelected ? '#0A0A0A' : '#F5F5F5',
                      border:          isSelected
                        ? '1px solid #C9A96E'
                        : '1px solid rgba(201,169,110,0.15)',
                      boxShadow: isSelected ? '0 0 12px rgba(201,169,110,0.2)' : 'none',
                    }}
                    aria-pressed={isSelected}
                  >
                    <span>{start}</span>
                    <span
                      className="text-sm"
                      style={{ color: isSelected ? 'rgba(0,0,0,0.5)' : '#5A5450' }}
                    >
                      hasta {end}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })()
      )}
    </div>
  )
}
