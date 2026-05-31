'use client'

import { useEffect, useState } from 'react'
import { getBookingSettings, updateBookingSetting } from '@/actions/bookingSettings'

interface StatusData {
  resend:           boolean
  cron:             boolean
  serviceRole:      boolean
  bookingsEnabled:  boolean
  remindersEnabled: boolean
}

interface BookingRules {
  bookings_enabled:        boolean
  cancel_hours_before:     number
  reschedule_hours_before: number
  min_hours_advance:       number
  advance_booking_days:    number
  reminders_enabled:       boolean
  reminder_24h_enabled:    boolean
  reminder_2h_enabled:     boolean
}

/* ─── Status pill ────────────────────────────────────────────── */
function StatusPill({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: ok ? 'rgba(74,222,128,0.1)' : 'rgba(255,80,80,0.08)',
          color:           ok ? '#4ADE80' : '#FF8080',
          border:          `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(255,80,80,0.18)'}`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: ok ? '#4ADE80' : '#FF8080' }}
        />
        {label}
      </span>
      {!ok && hint && (
        <span className="text-xs mt-1" style={{ color: '#4A4540' }}>{hint}</span>
      )}
    </div>
  )
}

/* ─── Toggle row ─────────────────────────────────────────────── */
function ToggleRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: disabled ? '#4A4540' : '#F2EDE7' }}>{label}</span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
        style={{
          backgroundColor: (checked && !disabled) ? '#C9A96E' : 'rgba(255,255,255,0.08)',
          border:          '1px solid rgba(201,169,110,0.2)',
          cursor:          disabled ? 'not-allowed' : 'pointer',
          opacity:         disabled ? 0.5 : 1,
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            backgroundColor: (checked && !disabled) ? '#0E0B08' : '#4A4540',
            left:            (checked && !disabled) ? '22px' : '2px',
          }}
        />
      </button>
    </div>
  )
}

/* ─── Number input ───────────────────────────────────────────── */
function NumberInput({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div>
      <label className="text-xs block mb-1" style={{ color: '#7A7268' }}>{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        onBlur={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full"
        style={{
          backgroundColor: '#1C1915',
          border:          '1px solid rgba(201,169,110,0.2)',
          color:           '#F2EDE7',
          borderRadius:    '0.75rem',
          padding:         '0.5rem 0.75rem',
          fontSize:        '0.875rem',
          outline:         'none',
        }}
      />
    </div>
  )
}

/* ─── Section wrapper ────────────────────────────────────────── */
function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
    >
      <p className="text-sm font-semibold mb-4" style={{ color: '#F2EDE7' }}>{title}</p>
      {children}
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function AdminAjustesPage() {
  const [status,        setStatus]        = useState<StatusData | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [rules,         setRules]         = useState<BookingRules>({
    bookings_enabled:        true,
    cancel_hours_before:     3,
    reschedule_hours_before: 3,
    min_hours_advance:       2,
    advance_booking_days:    90,
    reminders_enabled:       true,
    reminder_24h_enabled:    true,
    reminder_2h_enabled:     true,
  })
  const [rulesLoading, setRulesLoading] = useState(true)
  const [saving,       setSaving]       = useState<string | null>(null)

  async function fetchStatus() {
    setStatusLoading(true)
    try {
      const res  = await fetch('/api/admin/status')
      const data = await res.json()
      setStatus(data)
    } catch {
      // silently fail
    } finally {
      setStatusLoading(false)
    }
  }

  async function fetchRules() {
    setRulesLoading(true)
    try {
      const s = await getBookingSettings()
      setRules({
        bookings_enabled:        s.bookings_enabled,
        cancel_hours_before:     s.cancel_hours_before,
        reschedule_hours_before: s.reschedule_hours_before,
        min_hours_advance:       s.min_hours_advance,
        advance_booking_days:    s.advance_booking_days,
        reminders_enabled:       s.reminders_enabled,
        reminder_24h_enabled:    s.reminder_24h_enabled,
        reminder_2h_enabled:     s.reminder_2h_enabled,
      })
    } catch {
      // silently fail
    } finally {
      setRulesLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchRules()
  }, [])

  async function saveSetting(key: string, value: string) {
    setSaving(key)
    await updateBookingSetting(key, value)
    setSaving(null)
  }

  async function handleRuleToggle(key: keyof BookingRules, value: boolean) {
    setRules(r => ({ ...r, [key]: value }))
    await saveSetting(key, String(value))
  }

  async function handleRuleNumber(key: keyof BookingRules, value: number) {
    setRules(r => ({ ...r, [key]: value }))
    await saveSetting(key, String(value))
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Ajustes
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A7268' }}>
          Estado, reglas de reservas y recordatorios.
        </p>
      </div>

      {/* ── Section 1: Estado de servicios ───────────────────── */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#4A4540' }}>
          Estado de servicios
        </p>
        {statusLoading ? (
          <div
            className="rounded-2xl p-5 animate-pulse"
            style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.06)', height: 100 }}
          />
        ) : status ? (
          <SectionBox title="Estado del sistema">
            <div className="flex flex-wrap gap-3">
              <StatusPill
                ok={status.resend}
                label={status.resend ? 'Email conectado' : 'Email no configurado'}
                hint={status.resend ? undefined : 'Añade RESEND_API_KEY a las variables de entorno.'}
              />
              <StatusPill
                ok={status.cron}
                label={status.cron ? 'Cron configurado' : 'Cron no configurado'}
                hint={status.cron ? undefined : 'Añade CRON_SECRET para activar recordatorios automáticos.'}
              />
              <StatusPill
                ok={status.serviceRole}
                label={status.serviceRole ? 'Service key OK' : 'Service key faltante'}
                hint={status.serviceRole ? undefined : 'Añade SUPABASE_SERVICE_ROLE_KEY.'}
              />
              <StatusPill
                ok={status.bookingsEnabled}
                label={status.bookingsEnabled ? 'Reservas: Activas' : 'Reservas: Pausadas'}
              />
              <StatusPill
                ok={status.remindersEnabled}
                label={status.remindersEnabled ? 'Recordatorios: Activos' : 'Recordatorios: Inactivos'}
              />
            </div>
          </SectionBox>
        ) : null}
      </div>

      {/* ── Section 2: Reglas de reservas ─────────────────────── */}
      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#4A4540' }}>
          Reglas de reservas
        </p>
        {rulesLoading ? (
          <div
            className="rounded-2xl p-5 animate-pulse"
            style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.06)', height: 160 }}
          />
        ) : (
          <SectionBox title="Configuración de reservas">
            <div className="flex flex-col gap-4">
              <ToggleRow
                label="Reservas activas"
                checked={rules.bookings_enabled}
                onChange={v => handleRuleToggle('bookings_enabled', v)}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumberInput
                  label={`Cancelar antes (h)${saving === 'cancel_hours_before' ? ' — guardando…' : ''}`}
                  value={rules.cancel_hours_before}
                  onChange={v => handleRuleNumber('cancel_hours_before', v)}
                  min={0} max={72}
                />
                <NumberInput
                  label={`Reagendar antes (h)${saving === 'reschedule_hours_before' ? ' — guardando…' : ''}`}
                  value={rules.reschedule_hours_before}
                  onChange={v => handleRuleNumber('reschedule_hours_before', v)}
                  min={0} max={72}
                />
                <NumberInput
                  label={`Anticipación mínima (h)${saving === 'min_hours_advance' ? ' — guardando…' : ''}`}
                  value={rules.min_hours_advance}
                  onChange={v => handleRuleNumber('min_hours_advance', v)}
                  min={0} max={48}
                />
                <NumberInput
                  label={`Reservas máximo (días)${saving === 'advance_booking_days' ? ' — guardando…' : ''}`}
                  value={rules.advance_booking_days}
                  onChange={v => handleRuleNumber('advance_booking_days', v)}
                  min={1} max={365}
                />
              </div>
            </div>
          </SectionBox>
        )}
      </div>

      {/* ── Section 3: Recordatorios ──────────────────────────── */}
      <div className="mt-6 mb-12">
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#4A4540' }}>
          Recordatorios
        </p>
        {rulesLoading ? (
          <div
            className="rounded-2xl p-5 animate-pulse"
            style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.06)', height: 120 }}
          />
        ) : (
          <SectionBox title="Emails automáticos">
            {status && !status.resend && (
              <p className="text-xs mb-4 px-3 py-2 rounded-xl"
                style={{ color: '#FFA032', backgroundColor: 'rgba(255,160,50,0.06)', border: '1px solid rgba(255,160,50,0.15)' }}>
                Email no configurado — activa RESEND_API_KEY para enviar recordatorios.
              </p>
            )}
            <div className="flex flex-col gap-4">
              <ToggleRow
                label="Recordatorios activos"
                checked={rules.reminders_enabled}
                onChange={v => handleRuleToggle('reminders_enabled', v)}
                disabled={status ? !status.resend : false}
              />
              <ToggleRow
                label="Recordatorio 24 horas antes"
                checked={rules.reminder_24h_enabled}
                onChange={v => handleRuleToggle('reminder_24h_enabled', v)}
                disabled={!rules.reminders_enabled || (status ? !status.resend : false)}
              />
              <ToggleRow
                label="Recordatorio 2 horas antes"
                checked={rules.reminder_2h_enabled}
                onChange={v => handleRuleToggle('reminder_2h_enabled', v)}
                disabled={!rules.reminders_enabled || (status ? !status.resend : false)}
              />
            </div>
          </SectionBox>
        )}
      </div>
    </div>
  )
}
