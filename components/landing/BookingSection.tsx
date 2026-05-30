'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  CalendarBlank,
  Clock,
  User,
  ArrowLeft,
  CheckCircle,
  Warning,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth/AuthModal'
import { bookAppointment } from '@/actions/appointments'
import BookingCalendar from './BookingCalendar'
import TimeSlotPicker from './TimeSlotPicker'
import BookingConfirmation from './BookingConfirmation'
import type { Appointment } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/* ─── Types ────────────────────────────────────────────────── */
interface Slot {
  id: string
  start_time: string
  end_time: string
}

interface ActiveBooking {
  id: string
  slot_date: string
  slot_start_time: string
}

type BookingStep = 'date' | 'slot' | 'form' | 'confirmed' | 'blocked'

/* ─── Constants ────────────────────────────────────────────── */
const BOOKING_STORAGE_KEY = 'bgbarber_pending_booking'

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN:          'Ese hueco ya fue reservado. Elige otro.',
  SLOT_NOT_FOUND:      'El hueco ya no está disponible.',
  ALREADY_HAS_BOOKING: 'Ya tienes una cita activa.',
  VALIDATION_ERROR:    'Revisa los datos introducidos.',
  UNAUTHORIZED:        'Sesión expirada. Recarga la página.',
  DEFAULT:             'Algo falló. Inténtalo de nuevo.',
}

/* ─── Shared input style ────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border:          '1px solid rgba(201,169,110,0.2)',
  color:           '#F2EDE7',
  borderRadius:    '0.75rem',
  padding:         '0.65rem 0.875rem',
  fontSize:        '1rem',
  outline:         'none',
  width:           '100%',
  transition:      'border-color 0.15s',
}

/* ─── Step indicator (mobile only) ────────────────────────── */
function StepIndicator({ step }: { step: BookingStep }) {
  const steps = ['date', 'slot', 'form'] as BookingStep[]
  const currentIndex = steps.indexOf(step)
  const labels = ['Fecha', 'Hora', 'Confirmar']

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {labels.map((label, i) => {
        const isCompleted = i < currentIndex
        const isActive    = i === currentIndex
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                style={{
                  width:           '28px',
                  height:          '28px',
                  backgroundColor: isCompleted || isActive
                    ? '#C9A96E'
                    : 'rgba(201,169,110,0.08)',
                  color:           isCompleted || isActive ? '#0E0B08' : '#5A5450',
                  border:          '1px solid rgba(201,169,110,0.2)',
                }}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span
                className="text-xs mt-1.5 font-medium"
                style={{ color: isActive ? '#F2EDE7' : '#4A4540' }}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className="mb-4 mx-2"
                style={{
                  width:           '28px',
                  height:          '1px',
                  backgroundColor: i < currentIndex
                    ? '#C9A96E'
                    : 'rgba(201,169,110,0.15)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Back button ──────────────────────────────────────────── */
function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 mb-6 text-sm font-medium transition-opacity hover:opacity-70"
      style={{ color: '#C9A96E' }}
    >
      <ArrowLeft size={14} weight="bold" />
      {label}
    </button>
  )
}

/* ─── Blocked state (user already has booking) ─────────────── */
function BlockedState({ booking }: { booking: ActiveBooking | null }) {
  const dateLabel = booking
    ? format(parseISO(booking.slot_date), "EEEE d 'de' MMMM yyyy", { locale: es })
    : null

  return (
    <div
      className="flex flex-col items-center text-center py-10 gap-5 rounded-2xl"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}
      >
        <CheckCircle size={28} weight="fill" style={{ color: '#C9A96E' }} />
      </div>
      <div>
        <p className="text-lg font-semibold" style={{ color: '#F2EDE7' }}>
          Ya tienes una cita reservada
        </p>
        {dateLabel && (
          <>
            <p className="mt-2 text-sm capitalize" style={{ color: '#888' }}>
              {dateLabel}
            </p>
            <p className="text-base font-semibold mt-1" style={{ color: '#C9A96E' }}>
              {booking!.slot_start_time.slice(0, 5)}
            </p>
          </>
        )}
      </div>
      <p className="text-sm max-w-xs" style={{ color: '#5A5450' }}>
        Para ver o cancelar tu cita, haz clic en{' '}
        <span style={{ color: '#C9A96E' }}>Mis citas</span> en el menú superior.
      </p>
    </div>
  )
}

/* ─── Form fields (shared between mobile + desktop) ────────── */
interface FormFieldsProps {
  name:     string
  phone:    string
  notes:    string
  setName:  (v: string) => void
  setPhone: (v: string) => void
  setNotes: (v: string) => void
}

function FormFields({ name, phone, notes, setName, setPhone, setNotes }: FormFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" style={{ color: '#5A5450' }}>
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre completo"
          maxLength={100}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
          onBlur={(e)  => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" style={{ color: '#5A5450' }}>
          Teléfono
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+34 600 000 000"
          maxLength={20}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
          onBlur={(e)  => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
        />
        <p className="text-xs" style={{ color: '#3A3530' }}>
          Incluye el prefijo (+34 para España)
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" style={{ color: '#5A5450' }}>
          Notas <span style={{ color: '#3A3530' }}>(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tipo de corte, preferencias..."
          maxLength={400}
          rows={2}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
          onBlur={(e)  => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
        />
      </div>
    </div>
  )
}

/* ─── Confirm button ────────────────────────────────────────── */
function ConfirmButton({
  canConfirm,
  loading,
  onClick,
}: {
  canConfirm: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!canConfirm || loading}
      className="w-full py-3.5 rounded-full text-base font-semibold transition-all active:scale-[0.98]"
      style={{
        backgroundColor: canConfirm && !loading ? '#C9A96E' : 'rgba(201,169,110,0.15)',
        color:            canConfirm && !loading ? '#0E0B08' : '#5A5450',
        cursor:           canConfirm && !loading ? 'pointer' : 'not-allowed',
        marginTop:        '0.5rem',
      }}
    >
      {loading ? 'Confirmando...' : 'Confirmar cita →'}
    </button>
  )
}

/* ─── Error banner ──────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm"
      style={{
        backgroundColor: 'rgba(255,80,80,0.07)',
        border:          '1px solid rgba(255,80,80,0.18)',
        color:           '#FF8080',
      }}
    >
      <Warning size={16} weight="fill" className="flex-shrink-0 mt-0.5" />
      {message}
    </div>
  )
}

/* ─── Desktop summary panel (left col) ─────────────────────── */
interface SummaryPanelProps {
  selectedDate: string | null
  selectedSlot: Slot | null
  name:     string
  phone:    string
  notes:    string
  setName:  (v: string) => void
  setPhone: (v: string) => void
  setNotes: (v: string) => void
  onConfirm:  () => void
  onChangeDate: () => void
  onChangeSlot: () => void
  loading:  boolean
  error:    string | null
  step:     BookingStep
}

function SummaryPanel({
  selectedDate,
  selectedSlot,
  name,
  phone,
  notes,
  setName,
  setPhone,
  setNotes,
  onConfirm,
  onChangeDate,
  onChangeSlot,
  loading,
  error,
  step,
}: SummaryPanelProps) {
  const dateLabel = selectedDate
    ? format(parseISO(selectedDate), "d 'de' MMMM, yyyy", { locale: es })
    : null

  const canConfirm =
    step === 'form' &&
    !!selectedDate &&
    !!selectedSlot &&
    name.trim().length >= 2 &&
    phone.trim().length >= 6

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#161310',
        border:          '1px solid rgba(201,169,110,0.12)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(201,169,110,0.08)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(201,169,110,0.1)',
            border:          '1px solid rgba(201,169,110,0.25)',
          }}
        >
          <User size={18} weight="duotone" style={{ color: '#C9A96E' }} />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: '#F2EDE7' }}>
            Rodrigo Bargueño
          </p>
          <p className="text-sm" style={{ color: '#5A5450' }}>
            Maestro Barbero
          </p>
        </div>
      </div>

      {/* Selection summary */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Date pill */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: selectedDate
              ? 'rgba(201,169,110,0.06)'
              : 'rgba(255,255,255,0.02)',
            border: selectedDate
              ? '1px solid rgba(201,169,110,0.15)'
              : '1px dashed rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <CalendarBlank
              size={16}
              weight="duotone"
              style={{ color: selectedDate ? '#C9A96E' : '#3A3530', flexShrink: 0 }}
            />
            <div>
              <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#4A4540' }}>
                Fecha
              </p>
              <p
                className="text-base font-medium capitalize"
                style={{ color: selectedDate ? '#F2EDE7' : '#3A3530' }}
              >
                {dateLabel ?? 'Selecciona una fecha'}
              </p>
            </div>
          </div>
          {selectedDate && (
            <button
              onClick={onChangeDate}
              className="text-xs font-medium transition-opacity hover:opacity-70 flex-shrink-0"
              style={{ color: '#C9A96E' }}
            >
              Cambiar
            </button>
          )}
        </div>

        {/* Slot pill */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: selectedSlot
              ? 'rgba(201,169,110,0.06)'
              : 'rgba(255,255,255,0.02)',
            border: selectedSlot
              ? '1px solid rgba(201,169,110,0.15)'
              : '1px dashed rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <Clock
              size={16}
              weight="duotone"
              style={{ color: selectedSlot ? '#C9A96E' : '#3A3530', flexShrink: 0 }}
            />
            <div>
              <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#4A4540' }}>
                Hora
              </p>
              <p
                className="text-base font-medium"
                style={{ color: selectedSlot ? '#F2EDE7' : '#3A3530' }}
              >
                {selectedSlot
                  ? `${selectedSlot.start_time.slice(0, 5)} – ${selectedSlot.end_time.slice(0, 5)}`
                  : 'Selecciona un horario'}
              </p>
            </div>
          </div>
          {selectedSlot && (
            <button
              onClick={onChangeSlot}
              className="text-xs font-medium transition-opacity hover:opacity-70 flex-shrink-0"
              style={{ color: '#C9A96E' }}
            >
              Cambiar
            </button>
          )}
        </div>

        {/* Form — only when date + slot selected */}
        {step === 'form' && (
          <div className="mt-1">
            <FormFields
              name={name} phone={phone} notes={notes}
              setName={setName} setPhone={setPhone} setNotes={setNotes}
            />
          </div>
        )}

        {error && <ErrorBanner message={error} />}
      </div>

      {/* CTA */}
      <div className="mt-auto px-5 pb-5">
        {step === 'form' ? (
          <ConfirmButton canConfirm={canConfirm} loading={loading} onClick={onConfirm} />
        ) : (
          <p className="text-center text-sm" style={{ color: '#3A3530' }}>
            Selecciona fecha y hora →
          </p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Main BookingSection
───────────────────────────────────────────────── */
export default function BookingSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  /* State */
  const [step,         setStep]         = useState<BookingStep>('date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null)
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [user,      setUser]      = useState<SupabaseUser | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [slotRefreshKey, setSlotRefreshKey] = useState(0)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)

  /* ── Auth + setup ────────────────────────────────────────── */
  useEffect(() => {
    const supabase = createClient()

    const setupUser = async (currentUser: SupabaseUser | null, event?: string) => {
      setUser(currentUser)

      if (!currentUser) {
        setActiveBooking(null)
        return
      }

      // Prefill from profile (don't overwrite if user already typed)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', currentUser.id)
        .maybeSingle()
      if (profile?.full_name) setName((n) => n || profile.full_name)
      if (profile?.phone)     setPhone((p) => p || profile.phone)

      // Check for active future booking
      const today = new Date().toISOString().split('T')[0]
      const { data: booking } = await supabase
        .from('appointments')
        .select('id, slot_date, slot_start_time')
        .eq('user_id', currentUser.id)
        .eq('status', 'confirmed')
        .gte('slot_date', today)
        .maybeSingle()

      if (booking) {
        setActiveBooking(booking)
        setStep('blocked')
        return
      }

      // Restore pending slot after OAuth redirect
      // Only on SIGNED_IN event (= after Google OAuth redirect back)
      if (event === 'SIGNED_IN') {
        try {
          const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY)
          if (raw) {
            sessionStorage.removeItem(BOOKING_STORAGE_KEY)
            const { date, slot } = JSON.parse(raw) as { date: string; slot: Slot }
            setSelectedDate(date)
            setSelectedSlot(slot)
            setStep('form')
            // Scroll back to booking section
            setTimeout(() => {
              document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' })
            }, 400)
          }
        } catch {
          // sessionStorage unavailable or malformed — silent fail
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => { setupUser(session?.user ?? null, event) },
    )

    return () => subscription.unsubscribe()
  }, [])

  /* ── Labels ──────────────────────────────────────────────── */
  const dateLabel = selectedDate
    ? format(parseISO(selectedDate), "d 'de' MMMM", { locale: es })
    : null
  const timeLabel = selectedSlot
    ? `${selectedSlot.start_time.slice(0, 5)} – ${selectedSlot.end_time.slice(0, 5)}`
    : null

  /* ── Navigation handlers ─────────────────────────────────── */
  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setError(null)
    setStep('slot')
  }

  function handleSelectSlot(slot: Slot) {
    if (!user) {
      // Save pending booking before Google OAuth redirect
      try {
        sessionStorage.setItem(
          BOOKING_STORAGE_KEY,
          JSON.stringify({ date: selectedDate, slot }),
        )
      } catch {}
      setAuthModalOpen(true)
      return
    }
    setSelectedSlot(slot)
    setError(null)
    setStep('form')
  }

  function handleBackToDate() {
    setSelectedDate(null)
    setSelectedSlot(null)
    setError(null)
    setStep('date')
  }

  function handleBackToSlot() {
    setSelectedSlot(null)
    setError(null)
    setStep('slot')
  }

  /* ── Confirm booking ─────────────────────────────────────── */
  async function handleConfirm() {
    if (!selectedDate || !selectedSlot || !user) return
    if (name.trim().length < 2 || phone.trim().length < 6) return

    setLoading(true)
    setError(null)

    const result = await bookAppointment({
      slot_date:       selectedDate,
      slot_start_time: selectedSlot.start_time,
      slot_end_time:   selectedSlot.end_time,
      client_name:     name.trim(),
      client_phone:    phone.trim(),
      notes:           notes.trim() || undefined,
    })

    setLoading(false)

    if ('error' in result && result.error) {
      if (result.error === 'SLOT_TAKEN' || result.error === 'SLOT_NOT_FOUND') {
        // Slot taken while user was filling form — refresh list and go back
        setSlotRefreshKey((k) => k + 1)
        setSelectedSlot(null)
        setStep('slot')
        setError('Ese hueco ya fue reservado. Elige otro horario.')
      } else if (result.error === 'ALREADY_HAS_BOOKING') {
        setStep('blocked')
      } else {
        setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.DEFAULT)
      }
      return
    }

    if ('appointment' in result && result.appointment) {
      setConfirmedAppointment(result.appointment as Appointment)
      setStep('confirmed')
    }
  }

  /* ── Reset ───────────────────────────────────────────────── */
  function handleReset() {
    setStep('date')
    setSelectedDate(null)
    setSelectedSlot(null)
    setConfirmedAppointment(null)
    setName('')
    setPhone('')
    setNotes('')
    setError(null)
  }

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  const canConfirm =
    step === 'form' &&
    !!selectedDate &&
    !!selectedSlot &&
    name.trim().length >= 2 &&
    phone.trim().length >= 6

  return (
    <section
      id="reservar"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#161310' }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center"
        >
          <p
            className="text-sm font-medium uppercase tracking-[0.25em] mb-4"
            style={{ color: '#C9A96E' }}
          >
            Reserva Online
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F2EDE7' }}
          >
            Elige tu fecha y hora
          </h2>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
        >

          {/* ════════════════════════════════════════
              MOBILE — step-by-step (< lg)
          ════════════════════════════════════════ */}
          <div className="lg:hidden">

            {/* Step indicator */}
            {(step === 'date' || step === 'slot' || step === 'form') && (
              <StepIndicator step={step} />
            )}

            {/* Blocked state */}
            {step === 'blocked' && <BlockedState booking={activeBooking} />}

            {/* Confirmed state */}
            {step === 'confirmed' && confirmedAppointment && (
              <div
                className="rounded-2xl p-8"
                style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
              >
                <BookingConfirmation
                  date={confirmedAppointment.slot_date}
                  startTime={confirmedAppointment.slot_start_time}
                  onBookAnother={handleReset}
                />
              </div>
            )}

            {/* Step: date */}
            {step === 'date' && (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: '#0E0B08', border: '1px solid rgba(201,169,110,0.12)' }}
              >
                <BookingCalendar
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                />
              </div>
            )}

            {/* Step: slot */}
            {step === 'slot' && (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: '#0E0B08', border: '1px solid rgba(201,169,110,0.12)' }}
              >
                {dateLabel && (
                  <BackButton
                    onClick={handleBackToDate}
                    label={`Cambiar fecha · ${dateLabel}`}
                  />
                )}
                <TimeSlotPicker
                  date={selectedDate!}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                  refreshKey={slotRefreshKey}
                />
                {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
              </div>
            )}

            {/* Step: form */}
            {step === 'form' && (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
              >
                {dateLabel && timeLabel && (
                  <BackButton
                    onClick={handleBackToSlot}
                    label={`${dateLabel} · ${timeLabel}`}
                  />
                )}

                {/* Mini summary */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                  style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.12)' }}
                >
                  <User size={16} weight="duotone" style={{ color: '#C9A96E', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: '#F2EDE7' }}>
                    Rodrigo Bargueño — BG Barber
                  </span>
                </div>

                <FormFields
                  name={name} phone={phone} notes={notes}
                  setName={setName} setPhone={setPhone} setNotes={setNotes}
                />

                {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

                <ConfirmButton
                  canConfirm={canConfirm}
                  loading={loading}
                  onClick={handleConfirm}
                />
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
              DESKTOP — 2-col layout (lg+)
          ════════════════════════════════════════ */}
          <div className="hidden lg:grid grid-cols-[300px_1fr] gap-5">

            {/* LEFT: summary panel or terminal states */}
            <div className="min-h-[400px]">
              {step === 'blocked' ? (
                <BlockedState booking={activeBooking} />
              ) : step === 'confirmed' && confirmedAppointment ? (
                <div
                  className="rounded-2xl p-8"
                  style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
                >
                  <BookingConfirmation
                    date={confirmedAppointment.slot_date}
                    startTime={confirmedAppointment.slot_start_time}
                    onBookAnother={handleReset}
                  />
                </div>
              ) : (
                <SummaryPanel
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  name={name} phone={phone} notes={notes}
                  setName={setName} setPhone={setPhone} setNotes={setNotes}
                  onConfirm={handleConfirm}
                  onChangeDate={handleBackToDate}
                  onChangeSlot={handleBackToSlot}
                  loading={loading}
                  error={error}
                  step={step}
                />
              )}
            </div>

            {/* RIGHT: calendar + slots (hidden in terminal states) */}
            {step !== 'blocked' && step !== 'confirmed' && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_auto]">

                  {/* Calendar */}
                  <div className="p-6 md:p-8">
                    <p
                      className="text-sm font-medium uppercase tracking-widest mb-6"
                      style={{ color: '#4A4540' }}
                    >
                      {selectedDate ? 'Fecha seleccionada' : 'Selecciona un día'}
                    </p>
                    <BookingCalendar
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                    />
                  </div>

                  {/* Divider + slots — only when date selected */}
                  {selectedDate && (
                    <>
                      <div
                        className="hidden md:block self-stretch my-6"
                        style={{ backgroundColor: 'rgba(201,169,110,0.07)' }}
                      />
                      <div
                        className="md:hidden h-px mx-6"
                        style={{ backgroundColor: 'rgba(201,169,110,0.07)' }}
                      />
                      <div className="p-6 md:p-8 md:min-w-[220px]">
                        <p
                          className="text-sm font-medium uppercase tracking-widest mb-6"
                          style={{ color: '#4A4540' }}
                        >
                          Horarios disponibles
                        </p>
                        <TimeSlotPicker
                          date={selectedDate}
                          selectedSlot={selectedSlot}
                          onSelectSlot={handleSelectSlot}
                          refreshKey={slotRefreshKey}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </motion.div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </section>
  )
}
