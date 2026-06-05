'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isBefore, startOfDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Lock, Sun, Broom, CheckCircle, Trash } from '@phosphor-icons/react'
import PremiumCalendar, { type DayMeta } from '@/components/shared/PremiumCalendar'
import { applySchedule } from '@/actions/availability'
import type { AgendaDay, Barber } from '@/types'

/* ─── Helpers ───────────────────────────────────────────────── */
function todayStr() { return new Date().toISOString().split('T')[0] }
function fmtMin(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
interface TimeBlock { start_time: string; end_time: string }
function genTimes(open: string, close: string, dur: number): TimeBlock[] {
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  const out: TimeBlock[] = []
  if (Number.isNaN(cur) || Number.isNaN(end) || dur <= 0) return out
  while (cur + dur <= end) {
    out.push({ start_time: fmtMin(cur), end_time: fmtMin(cur + dur) })
    cur += dur
  }
  return out
}

interface DateState { open: Set<string>; booked: Set<string> }

const BASE_KEY = 'bgbarber_schedule_base'

const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border: '1px solid rgba(201,169,110,0.15)',
  color: '#F2EDE7',
  borderRadius: '0.75rem',
  padding: '0.55rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  minHeight: '42px',
}
const cardStyle: React.CSSProperties = {
  backgroundColor: '#161310',
  border: '1px solid rgba(201,169,110,0.1)',
  borderRadius: '1rem',
  padding: '1.25rem',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: '#7A7268', display: 'block', marginBottom: '0.4rem',
}

export default function ScheduleDesigner() {
  /* ── Barbers ── */
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>('')

  /* ── Base hours ── */
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('20:00')
  const [duration, setDuration] = useState(30)

  /* ── Calendar ── */
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const [monthSlots, setMonthSlots] = useState<Set<string>>(new Set())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([todayStr()]))

  /* ── Per-date slot state ── */
  const [dateStates, setDateStates] = useState<Map<string, DateState>>(new Map())
  const [loadingStates, setLoadingStates] = useState(false)
  const [busyTime, setBusyTime] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t) } }, [toast])

  /* ── Load base hours from localStorage ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BASE_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (p.openTime) setOpenTime(p.openTime)
        if (p.closeTime) setCloseTime(p.closeTime)
        if (p.duration) setDuration(p.duration)
      }
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(BASE_KEY, JSON.stringify({ openTime, closeTime, duration })) } catch { /* ignore */ }
  }, [openTime, closeTime, duration])

  /* ── Load barbers ── */
  useEffect(() => {
    fetch('/api/barbers').then(r => r.json()).then(d => {
      const list: Barber[] = d.barbers ?? []
      setBarbers(list)
      if (list.length > 0) setSelectedBarberId(list[0].id)
    }).catch(() => {})
  }, [])

  /* ── Month dots ── */
  useEffect(() => {
    if (!selectedBarberId) return
    const from = format(startOfMonth(month), 'yyyy-MM-dd')
    const to = format(endOfMonth(month), 'yyyy-MM-dd')
    fetch(`/api/admin/agenda?from=${from}&to=${to}&barber_id=${selectedBarberId}`)
      .then(r => r.json())
      .then((data: { days?: AgendaDay[] }) => {
        const s = new Set<string>()
        for (const day of data.days ?? []) if (day.totalSlots > 0) s.add(day.date)
        setMonthSlots(s)
      })
      .catch(() => setMonthSlots(new Set()))
  }, [month, selectedBarberId, dateStates])

  /* ── Load per-date state for selected dates ── */
  const loadStates = useCallback(async (dates: string[], barberId: string) => {
    if (!barberId || dates.length === 0) { setDateStates(new Map()); return }
    setLoadingStates(true)
    try {
      const entries = await Promise.all(dates.map(async (d) => {
        const res = await fetch(`/api/admin/agenda?from=${d}&to=${d}&barber_id=${barberId}`)
        const data = await res.json()
        const day = (data.days ?? []).find((x: AgendaDay) => x.date === d)
        const open = new Set<string>()
        const booked = new Set<string>()
        for (const s of day?.slots ?? []) {
          const t = s.slot.start_time.slice(0, 5)
          open.add(t)
          if (s.appointment?.status === 'confirmed') booked.add(t)
        }
        return [d, { open, booked }] as const
      }))
      setDateStates(new Map(entries))
    } catch {
      setDateStates(new Map())
    } finally {
      setLoadingStates(false)
    }
  }, [])

  useEffect(() => {
    loadStates([...selectedDates], selectedBarberId)
  }, [selectedDates, selectedBarberId, loadStates])

  /* ── Derived ── */
  const times = useMemo(() => genTimes(openTime, closeTime, duration), [openTime, closeTime, duration])
  const sortedDates = useMemo(() => [...selectedDates].sort(), [selectedDates])

  // For a time: how many selected dates have it open / booked
  function timeStatus(t: string): { openCount: number; bookedCount: number; total: number } {
    let openCount = 0, bookedCount = 0
    for (const d of sortedDates) {
      const st = dateStates.get(d)
      if (st?.open.has(t)) openCount++
      if (st?.booked.has(t)) bookedCount++
    }
    return { openCount, bookedCount, total: sortedDates.length }
  }

  /* ── Calendar handlers ── */
  function toggleDate(dateStr: string) {
    setSelectedDates(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr)
      return next
    })
  }
  const today = startOfDay(new Date())
  const getDayMeta = (dateStr: string, day: Date): DayMeta => {
    const isPast = isBefore(startOfDay(day), today)
    return { disabled: isPast, dimmed: isPast }
  }
  const renderDot = (dateStr: string) =>
    monthSlots.has(dateStr)
      ? <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2"><span className="w-1 h-1 rounded-full block" style={{ backgroundColor: '#4ADE80' }} /></div>
      : null

  /* ── Apply open/close ── */
  async function apply(action: 'open' | 'close', blocks: TimeBlock[], markBusy?: string) {
    if (!selectedBarberId || sortedDates.length === 0 || blocks.length === 0) return
    if (markBusy) setBusyTime(markBusy); else setBulkBusy(true)
    try {
      const res = await applySchedule({ barber_id: selectedBarberId, dates: sortedDates, times: blocks, action })
      if ('error' in res) {
        const msg = res.error === 'PAST_DATE' ? 'No se pueden editar fechas pasadas.'
          : res.error === 'UNAUTHORIZED' ? 'Sin permisos.'
          : 'Error al guardar.'
        setToast({ msg, ok: false })
      } else {
        const parts: string[] = []
        if (res.opened) parts.push(`${res.opened} abiertas`)
        if (res.closed) parts.push(`${res.closed} cerradas`)
        if (res.skipped) parts.push(`${res.skipped} con cita protegidas`)
        setToast({ msg: parts.length ? parts.join(' · ') : 'Sin cambios', ok: true })
        await loadStates(sortedDates, selectedBarberId)
      }
    } catch {
      setToast({ msg: 'Error inesperado.', ok: false })
    } finally {
      setBusyTime(null); setBulkBusy(false)
    }
  }

  function handleToggleTime(block: TimeBlock) {
    const { openCount, total } = timeStatus(block.start_time)
    const action = openCount === total ? 'close' : 'open'  // all open → close; else open in all
    apply(action, [block], block.start_time)
  }

  const multiBarber = barbers.length > 1
  const noDates = sortedDates.length === 0

  return (
    <div className="flex flex-col gap-5">
      {/* ── Barber selector ── */}
      {multiBarber && (
        <div style={cardStyle} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: '#7A7268' }}>Barbero</span>
          <div className="flex gap-2 flex-wrap">
            {barbers.map(b => (
              <button key={b.id} onClick={() => setSelectedBarberId(b.id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.08)',
                  color: selectedBarberId === b.id ? '#0E0B08' : '#7A7268',
                  border: `1px solid ${selectedBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.15)'}`,
                }}>
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Base hours ── */}
      <div style={cardStyle}>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>Horario base</h2>
        <p className="text-xs mb-4" style={{ color: '#7A7268' }}>Define qué horas aparecen en la rejilla.</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label style={labelStyle}>Apertura</label>
            <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Cierre</label>
            <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Duración</label>
            <select value={String(duration)} onChange={e => setDuration(parseInt(e.target.value, 10))}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '1.5rem' }}>
              {[15, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl p-4 w-full max-w-sm" style={{ backgroundColor: '#F8F5F0' }}>
          <PremiumCalendar
            month={month}
            onMonthChange={setMonth}
            selectedDate={null}
            onSelectDate={toggleDate}
            canGoPrev={month.getTime() > new Date(2020, 0, 1).getTime()}
            canGoNext
            loading={false}
            getDayMeta={getDayMeta}
            renderDot={renderDot}
            isSelected={(d) => selectedDates.has(d)}
            legend={
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
                  <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>Con horas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-[4px]" style={{ backgroundColor: '#C9A96E' }} />
                  <span style={{ color: '#4A4540', fontSize: '0.75rem' }}>Seleccionado</span>
                </div>
              </>
            }
          />
        </div>

        {/* Selected dates summary */}
        <div className="flex items-center gap-2 flex-wrap justify-center max-w-sm">
          {noDates ? (
            <span className="text-sm" style={{ color: '#7A7268' }}>Toca uno o varios días para editar sus horas</span>
          ) : (
            <>
              {sortedDates.slice(0, 6).map(d => (
                <span key={d} className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ backgroundColor: 'rgba(201,169,110,0.1)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.2)' }}>
                  {format(parseISO(d), "EEE d MMM", { locale: es })}
                </span>
              ))}
              {sortedDates.length > 6 && (
                <span className="text-xs" style={{ color: '#7A7268' }}>+{sortedDates.length - 6} más</span>
              )}
              <button onClick={() => setSelectedDates(new Set())}
                className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Trash size={12} /> Limpiar
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Hour grid ── */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C9A96E' }}>
            Horas {noDates ? '' : `· ${sortedDates.length} día${sortedDates.length > 1 ? 's' : ''}`}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => apply('open', times)}
              disabled={noDates || bulkBusy || times.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
              <Sun size={14} weight="fill" /> Abrir todo
            </button>
            <button
              onClick={() => apply('close', times)}
              disabled={noDates || bulkBusy || times.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: 'rgba(255,80,80,0.1)', color: '#FF8080', border: '1px solid rgba(255,80,80,0.22)' }}>
              <Broom size={14} weight="fill" /> Cerrar todo
            </button>
          </div>
        </div>

        {noDates ? (
          <p className="text-sm py-6 text-center" style={{ color: '#4A4540' }}>Selecciona días en el calendario</p>
        ) : times.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: '#FF8080' }}>El horario base no genera horas. Revisa apertura/cierre.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {times.map(block => {
                const t = block.start_time
                const { openCount, bookedCount, total } = timeStatus(t)
                const all = openCount === total
                const some = openCount > 0 && openCount < total
                const busy = busyTime === t
                const locked = bookedCount > 0

                let bg = 'transparent', color = '#7A7268', border = 'rgba(201,169,110,0.15)'
                if (all) { bg = 'rgba(74,222,128,0.14)'; color = '#4ADE80'; border = 'rgba(74,222,128,0.3)' }
                else if (some) { bg = 'rgba(201,169,110,0.1)'; color = '#C9A96E'; border = 'rgba(201,169,110,0.3)' }

                return (
                  <button
                    key={t}
                    onClick={() => handleToggleTime(block)}
                    disabled={busy || bulkBusy || loadingStates}
                    title={locked ? 'Algún día tiene cita — esas no se cierran' : undefined}
                    className="relative flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-medium tabular-nums transition-all disabled:opacity-50"
                    style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}>
                    {t}
                    {locked && <Lock size={11} weight="fill" style={{ opacity: 0.7 }} />}
                    {some && !locked && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A96E' }} />}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7268' }}>
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.4)' }} /> Abierta
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7268' }}>
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(201,169,110,0.4)' }} /> Parcial (varios días)
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7268' }}>
                <Lock size={12} /> Con cita (protegida)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          backgroundColor: toast.ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,80,80,0.12)',
          border: `1px solid ${toast.ok ? 'rgba(74,222,128,0.3)' : 'rgba(255,80,80,0.3)'}`,
          color: toast.ok ? '#4ADE80' : '#FF8080',
          padding: '0.7rem 1.1rem', borderRadius: '12px', fontSize: '0.85rem', maxWidth: '90vw',
        }}>
          <span className="flex items-center gap-2">
            {toast.ok && <CheckCircle size={15} weight="fill" />}{toast.msg}
          </span>
        </div>
      )}
    </div>
  )
}
