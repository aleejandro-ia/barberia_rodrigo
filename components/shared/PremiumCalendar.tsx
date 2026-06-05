'use client'

import { motion, useReducedMotion } from 'motion/react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  startOfDay,
  isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

export interface DayMeta {
  /** Day cannot be selected (past / no availability). */
  disabled: boolean
  /** Render dimmed (e.g. available but past, or no slots) without disabling click. */
  dimmed?: boolean
}

interface PremiumCalendarProps {
  month: Date
  onMonthChange: (d: Date) => void
  selectedDate: string | null
  onSelectDate: (date: string) => void
  canGoPrev: boolean
  canGoNext: boolean
  loading: boolean
  /** Per-day state — keeps all data logic in the parent wrapper. */
  getDayMeta: (dateStr: string, day: Date) => DayMeta
  /** Optional dot(s) rendered under the day number (availability indicators). */
  renderDot?: (dateStr: string) => React.ReactNode
  /** Optional legend row below the grid. */
  legend?: React.ReactNode
  /**
   * Optional multi-select predicate. When provided, a day is highlighted as
   * selected if this returns true (overrides the single `selectedDate` match).
   * Backward compatible: callers that omit it keep single-select behavior.
   */
  isSelected?: (dateStr: string) => boolean
}

export default function PremiumCalendar({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  canGoPrev,
  canGoNext,
  loading,
  getDayMeta,
  renderDot,
  legend,
  isSelected: isSelectedFn,
}: PremiumCalendarProps) {
  const shouldReduceMotion = useReducedMotion()

  const today = startOfDay(new Date())
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  /* Monday-first padding */
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7
  const paddingDays = Array.from({ length: firstDayOfWeek })

  const goPrev = () =>
    canGoPrev && onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  const goNext = () =>
    canGoNext && onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))

  const navBtn = (enabled: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: `1px solid ${enabled ? 'rgba(201,169,110,0.25)' : 'rgba(201,169,110,0.07)'}`,
    color: enabled ? '#C9A96E' : '#3A3530',
    backgroundColor: 'transparent',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.4,
  })

  return (
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className="flex items-center justify-center transition-all duration-150 hover:scale-105"
          style={navBtn(canGoPrev)}
          aria-label="Mes anterior"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        <motion.div
          key={format(month, 'yyyy-MM')}
          initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p
            className="text-lg font-semibold capitalize tracking-wide"
            style={{ color: '#1A1512', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            {format(month, 'MMMM', { locale: es })}
          </p>
          <p className="text-sm mt-0.5" style={{ color: '#7A7068' }}>
            {format(month, 'yyyy')}
          </p>
        </motion.div>

        <button
          onClick={goNext}
          disabled={!canGoNext}
          className="flex items-center justify-center transition-all duration-150 hover:scale-105"
          style={navBtn(canGoNext)}
          aria-label="Mes siguiente"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center py-1"
            style={{ color: '#8A8078', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <motion.div
        key={`grid-${format(month, 'yyyy-MM')}`}
        className="grid grid-cols-7 gap-1.5 relative"
        initial={shouldReduceMotion ? false : 'hidden'}
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.012 } },
        }}
      >
        {loading && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(248,245,240,0.85)' }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.25)', borderTopColor: '#C9A96E' }}
            />
          </div>
        )}

        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const meta = getDayMeta(dateStr, day)
          const isSelected = isSelectedFn ? isSelectedFn(dateStr) : selectedDate === dateStr
          const isToday = isSameDay(day, today)
          const clickable = !meta.disabled

          return (
            <motion.button
              key={dateStr}
              variants={{
                hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
                show: { opacity: 1, y: 0, filter: 'blur(0px)' },
              }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              whileHover={clickable && !isSelected ? { scale: 1.08 } : undefined}
              whileTap={clickable ? { scale: 0.92 } : undefined}
              onClick={() => clickable && onSelectDate(dateStr)}
              disabled={!clickable}
              className="relative flex items-center justify-center font-medium"
              style={{
                aspectRatio: '1',
                width: '100%',
                maxWidth: 46,
                minHeight: 38,
                margin: '0 auto',
                fontSize: '0.95rem',
                borderRadius: 12,
                backgroundColor: isSelected ? '#C9A96E' : 'transparent',
                color: isSelected
                  ? '#0E0B08'
                  : meta.dimmed
                    ? '#C8C0B8'
                    : clickable
                      ? '#1A1512'
                      : '#A8A098',
                cursor: clickable ? 'pointer' : 'default',
                border:
                  isToday && !isSelected
                    ? '1px solid rgba(201,169,110,0.45)'
                    : isSelected
                      ? '1px solid #C9A96E'
                      : '1px solid transparent',
                boxShadow: isSelected ? '0 4px 16px rgba(201,169,110,0.4)' : 'none',
              }}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              {format(day, 'd')}
              {!isSelected && renderDot?.(dateStr)}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Legend */}
      {legend && (
        <div className="flex items-center gap-5 mt-5 justify-center flex-wrap">{legend}</div>
      )}
    </div>
  )
}
