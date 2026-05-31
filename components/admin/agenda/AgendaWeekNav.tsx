'use client'

import { useState } from 'react'
import { CaretLeft, CaretRight, Copy } from '@phosphor-icons/react'
import { adminCopyWeekToNext } from '@/actions/agenda'
import { format } from 'date-fns'

interface AgendaWeekNavProps {
  weekLabel: string
  weekStart: Date
  onPrev:    () => void
  onNext:    () => void
  onToday:   () => void
  loading:   boolean
}

export default function AgendaWeekNav({ weekLabel, weekStart, onPrev, onNext, onToday, loading }: AgendaWeekNavProps) {
  const [copying,    setCopying]    = useState(false)
  const [copyToast,  setCopyToast]  = useState<string | null>(null)

  const btn: React.CSSProperties = {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    width:           32,
    height:          32,
    borderRadius:    '50%',
    border:          '1px solid rgba(201,169,110,0.2)',
    backgroundColor: 'transparent',
    color:           '#C9A96E',
    cursor:          'pointer',
    transition:      'background-color 0.15s',
    flexShrink:      0,
  }

  async function handleCopyWeek() {
    setCopying(true)
    setCopyToast(null)
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const result = await adminCopyWeekToNext(weekStartStr)
    setCopying(false)
    if ('error' in result) {
      setCopyToast('La semana no tiene franjas para copiar.')
    } else if (result.created === 0) {
      setCopyToast('La semana siguiente ya tiene franjas.')
    } else {
      setCopyToast(`${result.created} franja${result.created > 1 ? 's' : ''} creada${result.created > 1 ? 's' : ''} para la semana siguiente.`)
    }
    setTimeout(() => setCopyToast(null), 3500)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            style={btn}
            onClick={onPrev}
            disabled={loading}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Semana anterior"
          >
            <CaretLeft size={14} weight="bold" />
          </button>

          <h2 className="text-base font-semibold tracking-tight" style={{ color: '#F2EDE7', minWidth: 200, textAlign: 'center' }}>
            {weekLabel}
          </h2>

          <button
            style={btn}
            onClick={onNext}
            disabled={loading}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Semana siguiente"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyWeek}
            disabled={loading || copying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              border:          '1px solid rgba(201,169,110,0.2)',
              color:           '#7A7268',
              backgroundColor: 'transparent',
              cursor:          (loading || copying) ? 'not-allowed' : 'pointer',
              opacity:         (loading || copying) ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!loading && !copying) e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.06)' }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Copy size={12} />
            {copying ? 'Copiando…' : 'Copiar semana →'}
          </button>

          <button
            onClick={onToday}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              border:          '1px solid rgba(201,169,110,0.25)',
              color:           '#C9A96E',
              backgroundColor: 'transparent',
              cursor:          'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Hoy
          </button>
        </div>
      </div>

      {copyToast && (
        <p className="text-xs text-center py-1 px-3 rounded-lg"
          style={{ color: '#C9A96E', backgroundColor: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)' }}>
          {copyToast}
        </p>
      )}
    </div>
  )
}
