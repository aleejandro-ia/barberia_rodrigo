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
const DAY_MS = 24 * 60 * 60 * 1000

/** Per-date real state: open slots (start→end) + which starts have a confirmed booking. */
interface DateState { slots: Map<string, string>; booked: Set<string> }

const BASE_KEY = 'bgbarber_schedule_base_v2'   // { [barberId]: { openTime, closeTime, duration } }
const DEFAULT_BASE = { openTime: '09:00', closeTime: '20:00', duration: 30 }

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

  /* ── Base hours (per-barber, persisted in localStorage) ── */
  const [openTime, setOpenTime] = useState(DEFAULT_BASE.openTime)
  const [closeTime, setCloseTime] = useState(DEFAULT_BASE.closeTime)
  const [duration, setDuration] = useState(DEFAULT_BASE.duration)

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

  /* ── Load barbers ── */
  useEffect(() => {
    fetch('/api/barbers').then(r => r.json()).then(d => {
      const list: Barber[] = d.barbers ?? []
      setBarbers(list)
      if (list.length > 0) setSelectedBarberId(list[0].id)
    }).catch(() => {})
  }, [])

  /* ── Load base hours for the selected barber ── */
  useEffect(() => {
    if (!selectedBarberId) return
    try {
      const all = JSON.parse(localStorage.getItem(BASE_KEY) || '{}')
      const b = all[selectedBarberId] ?? {}
      setOpenTime(b.openTime ?? DEFAULT_BASE.openTime)
      setCloseTime(b.closeTime ?? DEFAULT_BASE.closeTime)
      setDuration(b.duration ?? DEFAULT_BASE.duration)
    } catch { /* ignore */ }
  }, [selectedBarberId])

  /* ── Persist base hours for the selected barber ── */
  useEffect(() => {
    if (!selectedBarberId) return
    try {
      const all = JSON.parse(localStorage.getItem(BASE_KEY) || '{}')
      all[selectedBarberId] = { openTime, closeTime, duration }
      localStorage.setItem(BASE_KEY, JSON.stringify(all))
    } catch { /* ignore */ }
  }, [openTime, closeTime, duration, selectedBarberId])

  /* ── Month dots (which days already have hours) ── */
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

  /* ── Load per-date state — ONE range request instead of N ── */
  const loadStates = useCallback(async (dates: string[], barberId: string, opts?: { silent?: boolean }) => {
    if (!barberId || dates.length === 0) { setDateStates(new Map()); return }
    if (!opts?.silent) setLoadingStates(true)
    try {
      const sorted = [...dates].sort()
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      const spanDays = (parseISO(max).getTime() - parseISO(min).getTime()) / DAY_MS

      let days: AgendaDay[] = []
      if (spanDays <= 31) {
        // Single range fetch (endpoint caps at 31 days)
        const res = await fetch(`/api/admin/agenda?from=${min}&to=${max}&barber_id=${barberId}`)
        const data = await res.json()
        days = data.days ?? []
      } else {
        // Rare: selection spans >31 days → fall back to per-date fetches
        const groups = await Promise.all(sorted.map(async (d) => {
          const res = await fetch(`/api/admin/agenda?from=${d}&to=${d}&barber_id=${barberId}`)
          const data = await res.json()
          return (data.days ?? []) as AgendaDay[]
        }))
        days = groups.flat()
      }

      const byDate = new Map<string, AgendaDay>()
      for (const day of days) byDate.set(day.date, day)

      const entries = sorted.map((d) => {
        const day = byDate.get(d)
        const slots = new Map<string, string>()
        const booked = new Set<string>()
        for (const s of day?.slots ?? []) {
          const t = s.slot.start_time.slice(0, 5)
          slots.set(t, s.slot.end_time.slice(0, 5))
          if (s.appointment?.status === 'confirmed') booked.add(t)
        }
        return [d, { slots, booked }] as const
      })
      setDateStates(new Map(entries))
    } catch {
      setDateStates(new Map())
    } finally {
      if (!opts?.silent) setLoadingStates(false)
    }
  }, [])

  useEffect(() => {
    loadStates([...selectedDates], selectedBarberId)
  }, [selectedDates, selectedBarberId, loadStates])

  /* ── Derived ── */
  const baseTimes = useMemo(() => genTimes(openTime, closeTime, duration), [openTime, closeTime, duration])
  const sortedDates = useMemo(() => [...selectedDates].sort(), [selectedDates])

  /**
   * The grid shows EVERY real hour: base-template hours PLUS any extra hour that
   * is actually open on a selected day (even outside the base range). Nothing hidden.
   */
  const gridTimes = useMemo<TimeBlock[]>(() => {
    const map = new Map<string, string>()       // start → end
    for (const b of baseTimes) map.set(b.start_time, b.end_time)
    for (const d of sortedDates) {
      const st = dateStates.get(d)
      if (!st) continue
      for (const [start, end] of st.slots) if (!map.has(start)) map.set(start, end)
    }
    return [...map.entries()]
      .map(([start_time, end_time]) => ({ start_time, end_time }))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [baseTimes, sortedDates, dateStates])

  // For a time: how many selected dates have it open / booked
  const timeStatus = useCallback((t: string) => {
    let openCount = 0, bookedCount = 0
    for (const d of sortedDates) {
      const st = dateStates.get(d)
      if (st?.slots.has(t)) openCount++
      if (st?.booked.has(t)) bookedCount++
    }
    return { openCount, bookedCount, total: sortedDates.length }
  }, [sortedDates, dateStates])

  /* ── Calendar handlers ── */
  function toggleDate(dateStr: string) {
    setSelectedDates(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr)
      return next
    })
  }
  const today = startOfDay(new Date())
  const getDayMeta = (_dateStr: string, day: Date): DayMeta => {
    const isPast = isBefore(startOfDay(day), today)
    return { disabled: isPast, dimmed: isPast }
  }
  const renderDot = (dateStr: string) =>
    monthSlots.has(dateStr)
      ? <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2"><span className="w-1 h-1 rounded-full block" style={{ backgroundColor: '#4ADE80' }} /></div>
      : null

  /* ── Deep clone dateStates so optimistic edits don't mutate React state ── */
  const cloneStates = useCallback((src: Map<string, DateState>) => {
    const m = new Map<string, DateState>()
    for (const [d, st] of src) m.set(d, { slots: new Map(st.slots), booked: st.booked })
    return m
  }, [])

  /* ── Apply open/close (optimistic, then reconcile with server truth) ── */
  async function apply(action: 'open' | 'close', blocks: TimeBlock[], markBusy?: string) {
    if (!selectedBarberId || sortedDates.length === 0 || blocks.length === 0) return

    const prev = dateStates                       // snapshot for rollback
    const next = cloneStates(dateStates)          // optimistic copy
    for (const d of sortedDates) {
      const st = next.get(d) ?? { slots: new Map<string, string>(), booked: new Set<string>() }
      for (const b of blocks) {
        if (action === 'open') st.slots.set(b.start_time, b.end_time)
        else if (!st.booked.has(b.start_time)) st.slots.delete(b.start_time)  // protected stays
      }
      next.set(d, st)
    }
    setDateStates(next)                           // instant UI feedback
    if (markBusy) setBusyTime(markBusy); else setBulkBusy(true)

    try {
      const res = await applySchedule({ barber_id: selectedBarberId, dates: sortedDates, times: blocks, action })
      if ('error' in res) {
        setDateStates(prev)                       // rollback
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
        await loadStates(sortedDates, selectedBarberId, { silent: true })   // reconcile, no flicker
      }
    } catch {
      setDateStates(prev)                         // rollback
      setToast({ msg: 'Error inesperado.', ok: false })
    } finally {
      setBusyTime(null); setBulkBusy(false)
    }
  }

  function handleToggleTime(block: TimeBlock) {
    const { openCount, total } = timeStatus(block.start_time)
    // Predictable rule: anything not fully-open → OPEN in all; fully-open → CLOSE.
    const action = openCount === total ? 'close' : 'open'
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
        <p className="text-xs mb-4" style={{ color: '#7A7268' }}>Qué horas se ofrecen por defecto en la rejilla. Las horas ya abiertas siempre se muestran, aunque queden fuera.</p>
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
              onClick={() => apply('open', gridTimes)}
              disabled={noDates || bulkBusy || loadingStates || gridTimes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
              <Sun size={14} weight="fill" /> Abrir todo
            </button>
            <button
              onClick={() => apply('close', gridTimes)}
              disabled={noDates || bulkBusy || loadingStates || gridTimes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: 'rgba(255,80,80,0.1)', color: '#FF8080', border: '1px solid rgba(255,80,80,0.22)' }}>
              <Broom size={14} weight="fill" /> Cerrar todo
            </button>
          </div>
        </div>

        {noDates ? (
          <p className="text-sm py-6 text-center" style={{ color: '#4A4540' }}>Selecciona días en el calendario</p>
        ) : gridTimes.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: '#FF8080' }}>El horario base no genera horas. Revisa apertura/cierre.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {gridTimes.map(block => {
                const t = block.start_time
                const { openCount, bookedCount, total } = timeStatus(t)
                const all = openCount === total && openCount > 0
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
                    title={
                      locked ? `${bookedCount} día(s) con cita — no se cierran`
                        : some ? `Abierta en ${openCount} de ${total} días`
                          : all ? 'Abierta — toca para cerrar'
                            : 'Cerrada — toca para abrir'
                    }
                    className="relative flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-medium tabular-nums transition-all disabled:opacity-50"
                    style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}>
                    {busy
                      ? <span className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,169,110,0.25)', borderTopColor: color }} />
                      : t}
                    {!busy && locked && <Lock size={11} weight="fill" style={{ opacity: 0.75 }} />}
                    {!busy && some && total > 1 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums"
                        style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}>
                        {openCount}/{total}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7268' }}>
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.4)' }} /> Abierta (todos)
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7268' }}>
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(201,169,110,0.4)' }} /> Parcial · nº = días abiertos
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
