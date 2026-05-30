'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

interface TimeSlotPickerProps {
  date: string
  selectedSlot: Slot | null
  onSelectSlot: (slot: Slot) => void
}

export default function TimeSlotPicker({ date, selectedSlot, onSelectSlot }: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!date) return
    setLoading(true)
    setSlots([])
    fetch(`/api/availability/slots?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.slots)) {
          setSlots(data.slots)
        } else {
          setSlots([])
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [date])

  const dateLabel = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="w-full">
      <p className="text-sm mb-4 capitalize" style={{ color: '#888888' }}>
        {dateLabel}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }}
          />
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: '#555' }}>
          No hay huecos disponibles para este dia
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id
            return (
              <button
                key={slot.id}
                onClick={() => onSelectSlot(slot)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor: isSelected ? '#C9A96E' : 'rgba(201,169,110,0.07)',
                  color: isSelected ? '#0A0A0A' : '#F5F5F5',
                  border: isSelected
                    ? '1px solid #C9A96E'
                    : '1px solid rgba(201,169,110,0.15)',
                }}
                aria-pressed={isSelected}
              >
                {slot.start_time.slice(0, 5)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
