'use client'

import { useState, useEffect } from 'react'
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
  barberId?: string
}

export default function TimeSlotPicker({
  date,
  selectedSlot,
  onSelectSlot,
  refreshKey = 0,
  minHoursAdvance = 2,
  barberId,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  const fetchSlots = () => {
    if (!date) return
    setLoading(true)
    setFetchError(false)
    setSlots([])
    const url = barberId
      ? `/api/availability/slots?date=${date}&barber_id=${barberId}`
      : `/api/availability/slots?date=${date}`
    fetch(url)
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
  }, [date, refreshKey, barberId])

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
          />
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm" style={{ color: '#5A5450' }}>
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
            <p className="text-sm py-6 text-center" style={{ color: '#4A4540' }}>
              No hay horarios disponibles para este dia
            </p>
          )

          return (
            <div className="grid grid-cols-4 gap-2">
              {visibleSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id
                return (
                  <button
                    key={slot.id}
                    onClick={() => onSelectSlot(slot)}
                    className="transition-all duration-150 active:scale-[0.95]"
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      backgroundColor: isSelected ? '#C9A96E' : '#1C1915',
                      color: isSelected ? '#0E0B08' : '#F2EDE7',
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 600 : 400,
                      border: isSelected ? 'none' : '1px solid rgba(201,169,110,0.1)',
                      width: '100%',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                    aria-pressed={isSelected}
                  >
                    {slot.start_time.slice(0, 5)}
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
