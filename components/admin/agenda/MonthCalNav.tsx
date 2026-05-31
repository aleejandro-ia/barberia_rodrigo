'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

interface MonthCalNavProps {
  currentMonth: Date
  onPrev:       () => void
  onNext:       () => void
  onToday:      () => void
}

export default function MonthCalNav({ currentMonth, onPrev, onNext, onToday }: MonthCalNavProps) {
  const label = format(currentMonth, 'MMMM yyyy', { locale: es })
  const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1)

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Month label */}
      <h2 className="text-base font-semibold" style={{ color: '#F2EDE7' }}>
        {labelCapitalized}
      </h2>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToday}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            border:          '1px solid rgba(201,169,110,0.2)',
            color:           '#C9A96E',
            backgroundColor: 'transparent',
            cursor:          'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Hoy
        </button>

        <button
          onClick={onPrev}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
          style={{
            border:          '1px solid rgba(201,169,110,0.15)',
            color:           '#7A7268',
            backgroundColor: 'transparent',
            cursor:          'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)'
            e.currentTarget.style.color = '#C9A96E'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)'
            e.currentTarget.style.color = '#7A7268'
          }}
          aria-label="Mes anterior"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        <button
          onClick={onNext}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
          style={{
            border:          '1px solid rgba(201,169,110,0.15)',
            color:           '#7A7268',
            backgroundColor: 'transparent',
            cursor:          'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)'
            e.currentTarget.style.color = '#C9A96E'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)'
            e.currentTarget.style.color = '#7A7268'
          }}
          aria-label="Mes siguiente"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}
