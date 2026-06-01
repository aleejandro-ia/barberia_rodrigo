'use client'

import { useState, useCallback, useEffect } from 'react'
import { deleteAvailabilitySlot } from '@/actions/availability'
import { getScheduleTemplate, saveScheduleTemplate, generateSlotsFromTemplate } from '@/actions/scheduleTemplate'
import type { ScheduleEntry } from '@/actions/scheduleTemplate'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import SlotBulkCreator from './SlotBulkCreator'
import type { Barber } from '@/types'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
// Ordered Mon–Sun for display, but day numbers stay 0-6 (Sun=0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border: '1px solid rgba(201,169,110,0.15)',
  color: '#F2EDE7',
  borderRadius: '0.75rem',
  padding: '0.65rem 0.875rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  minHeight: '44px',
  transition: 'border-color 0.15s',
}

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)'),
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(201,169,110,0.15)'),
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#7A7268',
  display: 'block',
  marginBottom: '0.375rem',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#161310',
  border: '1px solid rgba(201,169,110,0.1)',
  borderRadius: '1rem',
  padding: '1.5rem',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#C9A96E',
  marginBottom: '1.25rem',
}

export default function ScheduleManager() {
  // ── Barber selector ──
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>('')
  const [barbersLoading, setBarbersLoading] = useState(true)

  // ── Section 1: slots viewer ──
  const [date, setDate] = useState(todayStr())
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Section 2: weekly template ──
  const [templateEnabled, setTemplateEnabled] = useState<Record<number, boolean>>({})
  const [templateStart, setTemplateStart] = useState<Record<number, string>>({})
  const [templateEnd, setTemplateEnd] = useState<Record<number, string>>({})
  const [templateLoading, setTemplateLoading] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)

  // ── Section 3: generator ──
  const [genStartDate, setGenStartDate] = useState(todayStr())
  const [genWeeks, setGenWeeks] = useState('4')
  const [generating, setGenerating] = useState(false)

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  // Load barbers on mount
  useEffect(() => {
    async function loadBarbers() {
      try {
        const res = await fetch('/api/barbers')
        const data = await res.json()
        const list: Barber[] = data.barbers ?? []
        setBarbers(list)
        if (list.length > 0) setSelectedBarberId(list[0].id)
      } catch {
        // silent
      } finally {
        setBarbersLoading(false)
      }
    }
    loadBarbers()
  }, [])

  // Load template when barber changes
  useEffect(() => {
    if (!selectedBarberId) return
    async function loadTemplate() {
      setTemplateLoading(true)
      try {
        const entries = await getScheduleTemplate(selectedBarberId)
        const enabled: Record<number, boolean> = {}
        const starts: Record<number, string> = {}
        const ends: Record<number, string> = {}
        for (const entry of entries) {
          enabled[entry.day] = true
          starts[entry.day] = entry.start_time
          ends[entry.day] = entry.end_time
        }
        setTemplateEnabled(enabled)
        setTemplateStart(starts)
        setTemplateEnd(ends)
      } catch {
        // silent — user can still configure manually
      } finally {
        setTemplateLoading(false)
      }
    }
    loadTemplate()
  }, [selectedBarberId])

  // Reload slots when barber changes
  useEffect(() => {
    if (selectedBarberId && date) fetchSlots(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarberId])

  // ── Section 1 handlers ──
  const fetchSlots = useCallback(async (d: string) => {
    if (!d || !selectedBarberId) return
    setSlotsLoading(true)
    setSlotsError(null)
    try {
      const res = await fetch(`/api/availability/slots?date=${d}&barber_id=${selectedBarberId}`)
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setSlotsError('Error al cargar franjas')
    } finally {
      setSlotsLoading(false)
    }
  }, [selectedBarberId])

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value
    setDate(d)
    if (d) fetchSlots(d)
    else setSlots([])
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const result = await deleteAvailabilitySlot(deleteTarget.id)
      if ('error' in result) {
        const msg =
          result.error === 'HAS_BOOKING'
            ? 'Esta franja tiene una cita confirmada y no puede eliminarse.'
            : result.error === 'NOT_FOUND'
              ? 'Franja no encontrada.'
              : 'Error al eliminar.'
        setDeleteError(msg)
      } else {
        setDeleteTarget(null)
        fetchSlots(date)
      }
    } finally {
      setDeleting(false)
    }
  }

  // ── Section 2 handler ──
  async function handleSaveTemplate() {
    if (!selectedBarberId) return
    setSavingTemplate(true)
    const template: ScheduleEntry[] = DAY_ORDER.filter((d) => templateEnabled[d]).map((d) => ({
      day: d,
      start_time: templateStart[d] ?? '09:00',
      end_time: templateEnd[d] ?? '18:00',
    }))
    try {
      const result = await saveScheduleTemplate(template, selectedBarberId)
      if ('error' in result) {
        const msg =
          result.error === 'UNAUTHORIZED'
            ? 'Sin permisos de administrador.'
            : 'Datos inválidos. Verifica los horarios.'
        setToast({ msg, ok: false })
      } else {
        setToast({ msg: 'Plantilla guardada', ok: true })
      }
    } catch {
      setToast({ msg: 'Error al guardar plantilla', ok: false })
    } finally {
      setSavingTemplate(false)
    }
  }

  // ── Section 3 handler ──
  async function handleGenerate() {
    if (!selectedBarberId) return
    setGenerating(true)
    try {
      const result = await generateSlotsFromTemplate(genStartDate, parseInt(genWeeks, 10), selectedBarberId)
      if ('error' in result) {
        const msg =
          result.error === 'UNAUTHORIZED'
            ? 'Sin permisos de administrador.'
            : result.error === 'NO_TEMPLATE'
              ? 'Primero configura la plantilla semanal para este barbero.'
              : 'Datos inválidos.'
        setToast({ msg, ok: false })
      } else {
        setToast({ msg: `${result.created} franjas creadas, ${result.skipped} ya existían`, ok: true })
        fetchSlots(date)
      }
    } catch {
      setToast({ msg: 'Error al generar franjas', ok: false })
    } finally {
      setGenerating(false)
    }
  }

  const multiBarber = barbers.length > 1

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* ── Barber selector (only when 2+ barbers) ── */}
        {!barbersLoading && multiBarber && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)' }}
          >
            <span className="text-xs font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: '#7A7268' }}>
              Barbero
            </span>
            <div className="flex gap-2 flex-wrap">
              {barbers.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBarberId(b.id)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: selectedBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.08)',
                    color: selectedBarberId === b.id ? '#0E0B08' : '#7A7268',
                    border: `1px solid ${selectedBarberId === b.id ? '#C9A96E' : 'rgba(201,169,110,0.15)'}`,
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 1: Franjas por fecha ── */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Franjas por fecha</h2>

          <div className="mb-5">
            <label style={labelStyle}>Fecha</label>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              style={{ ...inputStyle, maxWidth: '220px' }}
              {...focusHandlers}
            />
          </div>

          {!selectedBarberId ? (
            <p className="text-sm py-4" style={{ color: '#4A4540' }}>Cargando barberos…</p>
          ) : slotsLoading ? (
            <div className="flex items-center gap-2 py-4">
              <div
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
              />
              <span className="text-sm" style={{ color: '#7A7268' }}>Cargando…</span>
            </div>
          ) : slotsError ? (
            <p className="text-sm py-4" style={{ color: '#FF8080' }}>{slotsError}</p>
          ) : !date ? (
            <p className="text-sm py-4" style={{ color: '#4A4540' }}>Selecciona una fecha</p>
          ) : slots.length === 0 ? (
            <p className="text-sm py-4" style={{ color: '#4A4540' }}>No hay franjas para esta fecha</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                  style={{
                    backgroundColor: 'rgba(201,169,110,0.06)',
                    border: '1px solid rgba(201,169,110,0.15)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#4ADE80' }} />
                  <span className="text-sm font-medium tabular-nums" style={{ color: '#F2EDE7' }}>
                    {slot.start_time.slice(0, 5)}
                  </span>
                  <button
                    onClick={() => setDeleteTarget(slot)}
                    className="ml-1 text-xs transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: '#7A7268' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF8080')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#7A7268')}
                    aria-label="Eliminar franja"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: Plantilla semanal ── */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Plantilla semanal</h2>

          {templateLoading ? (
            <div className="flex items-center gap-2 py-4">
              <div
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
              />
              <span className="text-sm" style={{ color: '#7A7268' }}>Cargando plantilla…</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mb-5">
              {DAY_ORDER.map((dayNum) => {
                const enabled = !!templateEnabled[dayNum]
                return (
                  <div
                    key={dayNum}
                    className="flex flex-col sm:flex-row sm:items-center gap-3"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      backgroundColor: enabled ? 'rgba(201,169,110,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${enabled ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.04)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Checkbox + day label */}
                    <label
                      className="flex items-center gap-3 cursor-pointer select-none"
                      style={{ minWidth: '120px' }}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          setTemplateEnabled((prev) => ({ ...prev, [dayNum]: e.target.checked }))
                        }
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#C9A96E',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: enabled ? '#F2EDE7' : '#7A7268' }}
                      >
                        {DAY_LABELS[dayNum]}
                      </span>
                    </label>

                    {/* Time inputs — only when enabled */}
                    {enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1">
                          <input
                            type="time"
                            value={templateStart[dayNum] ?? '09:00'}
                            onChange={(e) =>
                              setTemplateStart((prev) => ({ ...prev, [dayNum]: e.target.value }))
                            }
                            style={inputStyle}
                            {...focusHandlers}
                          />
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: '#7A7268' }}>a</span>
                        <div className="flex-1">
                          <input
                            type="time"
                            value={templateEnd[dayNum] ?? '18:00'}
                            onChange={(e) =>
                              setTemplateEnd((prev) => ({ ...prev, [dayNum]: e.target.value }))
                            }
                            style={inputStyle}
                            {...focusHandlers}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={handleSaveTemplate}
            disabled={savingTemplate || templateLoading || !selectedBarberId}
            className="py-3 px-6 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor:
                !savingTemplate && !templateLoading && selectedBarberId ? '#C9A96E' : 'rgba(201,169,110,0.15)',
              color: !savingTemplate && !templateLoading && selectedBarberId ? '#0E0B08' : '#4A4540',
              cursor: !savingTemplate && !templateLoading && selectedBarberId ? 'pointer' : 'not-allowed',
              minHeight: '44px',
            }}
          >
            {savingTemplate ? 'Guardando…' : 'Guardar plantilla'}
          </button>
        </div>

        {/* ── Section 3: Generador de franjas ── */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Generar franjas</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label style={labelStyle}>Desde</label>
              <input
                type="date"
                value={genStartDate}
                onChange={(e) => setGenStartDate(e.target.value)}
                style={inputStyle}
                {...focusHandlers}
              />
            </div>

            <div>
              <label style={labelStyle}>Semanas</label>
              <select
                value={genWeeks}
                onChange={(e) => setGenWeeks(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {[1, 2, 3, 4, 6, 8, 12].map((w) => (
                  <option key={w} value={String(w)}>
                    {w} {w === 1 ? 'semana' : 'semanas'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !genStartDate || !selectedBarberId}
            className="py-3 px-6 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor:
                !generating && genStartDate && selectedBarberId ? '#C9A96E' : 'rgba(201,169,110,0.15)',
              color: !generating && genStartDate && selectedBarberId ? '#0E0B08' : '#4A4540',
              cursor: !generating && genStartDate && selectedBarberId ? 'pointer' : 'not-allowed',
              minHeight: '44px',
            }}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
                  style={{ borderColor: 'rgba(14,11,8,0.3)', borderTopColor: '#0E0B08' }}
                />
                Generando…
              </span>
            ) : (
              'Generar franjas'
            )}
          </button>
        </div>

        {/* ── Section 4: Creación manual ── */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Creación manual</h2>
          {selectedBarberId ? (
            <SlotBulkCreator
              defaultDate={date}
              barberId={selectedBarberId}
              onCreated={() => fetchSlots(date)}
            />
          ) : (
            <p className="text-sm py-2" style={{ color: '#4A4540' }}>Cargando barberos…</p>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) { setDeleteTarget(null); setDeleteError(null) }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar franja</DialogTitle>
            <DialogDescription>
              ¿Eliminar la franja{' '}
              <strong className="text-zinc-200">
                {deleteTarget?.start_time.slice(0, 5)} – {deleteTarget?.end_time.slice(0, 5)}
              </strong>
              ? Si hay una cita confirmada, no podrá eliminarse.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p
              className="text-sm px-3 py-2 rounded-xl"
              style={{ color: '#FF8080', backgroundColor: 'rgba(255,128,128,0.08)' }}
            >
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <button
              onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
              disabled={deleting}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            {!deleteError && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: 'rgba(255,80,80,0.15)',
                  color: '#FF8080',
                  border: '1px solid rgba(255,80,80,0.25)',
                }}
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 100,
            backgroundColor: toast.ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,80,80,0.12)',
            border: `1px solid ${toast.ok ? 'rgba(74,222,128,0.3)' : 'rgba(255,80,80,0.3)'}`,
            color: toast.ok ? '#4ADE80' : '#FF8080',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.875rem',
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  )
}
