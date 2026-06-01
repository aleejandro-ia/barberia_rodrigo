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
  Scissors,
  ShieldCheck,
  CaretRight,
  Phone,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth/AuthModal'
import { bookAppointment } from '@/actions/appointments'
import BookingCalendar from './BookingCalendar'
import TimeSlotPicker from './TimeSlotPicker'
import BookingConfirmation from './BookingConfirmation'
import type { Appointment, Barber } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

/* ─── Types ────────────────────────────────────────────────── */
interface Slot {
  id: string
  start_time: string
  end_time: string
}

type BookingStep = 'date' | 'slot' | 'form' | 'confirmed'

/* ─── Constants ────────────────────────────────────────────── */
const BOOKING_STORAGE_KEY = 'bgbarber_pending_booking'

const FALLBACK_SERVICES = [
  { id: '1', name: 'Corte Clásico', price_eur: 7 },
  { id: '2', name: 'Corte',         price_eur: 9 },
  { id: '3', name: 'Corte con Barba', price_eur: 10 },
]

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN:          'Ese hueco ya fue reservado. Elige otro.',
  SLOT_NOT_FOUND:      'El hueco ya no está disponible.',
  ALREADY_HAS_BOOKING: 'Ya tienes una cita activa.',
  VALIDATION_ERROR:    'Revisa los datos introducidos.',
  UNAUTHORIZED:        'Sesión expirada. Recarga la página.',
  BOOKINGS_DISABLED:   'Las reservas online están desactivadas temporalmente.',
  TOO_SOON:            'Este hueco está demasiado próximo. Reserva con más antelación.',
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

/* ─── Step indicator (desktop + mobile) ───────────────────── */
function StepIndicator({ step }: { step: BookingStep }) {
  const steps = ['date', 'slot', 'form'] as BookingStep[]
  const currentIndex = steps.indexOf(step)
  const labels = ['Fecha', 'Hora', 'Datos']

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

/* ─── Multi-booking warning dialog ────────────────────────── */
interface MultiBookingWarningProps {
  onContinue: () => void
  onViewCitas: () => void
}

function MultiBookingWarning({ onContinue, onViewCitas }: MultiBookingWarningProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{
          backgroundColor: '#161310',
          border: '1px solid rgba(201,169,110,0.2)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}
          >
            <CheckCircle size={22} weight="fill" style={{ color: '#C9A96E' }} />
          </div>
          <p className="text-base font-semibold" style={{ color: '#F2EDE7' }}>
            Ya tienes cita(s) activa(s)
          </p>
        </div>
        <p className="text-sm" style={{ color: '#7A7268' }}>
          ¿Seguro que quieres añadir otra?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onViewCitas}
            className="w-full py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
          >
            Ver mis citas
          </button>
          <button
            onClick={onContinue}
            className="w-full py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: '#7A7268', border: '1px solid rgba(201,169,110,0.15)' }}
          >
            Continuar de todas formas
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Form fields (shared between mobile + desktop) ────────── */
interface ServiceItem {
  id: string
  name: string
  price_eur: number
}

interface FormFieldsProps {
  name:       string
  phone:      string
  service:    string
  setName:    (v: string) => void
  setPhone:   (v: string) => void
  setService: (v: string) => void
  services:   ServiceItem[]
}

function FormFields({ name, phone, service, setName, setPhone, setService, services }: FormFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Nombre */}
      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4A4540' }}>
          Nombre
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#C9A96E', pointerEvents: 'none' }}>
            <User size={14} />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
            maxLength={100}
            style={{ ...inputStyle, paddingLeft: '2.25rem' }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e)  => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
          />
        </div>
      </div>

      {/* Teléfono */}
      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4A4540' }}>
          Teléfono
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#C9A96E', pointerEvents: 'none' }}>
            <Phone size={14} />
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="600 123 456"
            maxLength={20}
            style={{ ...inputStyle, paddingLeft: '2.25rem' }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e)  => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
          />
        </div>
        <p style={{ fontSize: '0.7rem', color: '#3A3530' }}>
          9 dígitos sin prefijo — ej: 600 123 456
        </p>
      </div>

      {/* Servicio */}
      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4A4540' }}>
          Servicio
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#C9A96E', pointerEvents: 'none', zIndex: 1 }}>
            <Scissors size={14} />
          </div>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
            style={{
              ...inputStyle,
              paddingLeft: '2.25rem',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23C9A96E' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.875rem center',
              paddingRight: '2.25rem',
              cursor: 'pointer',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e)  => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
          >
            <option value="" disabled style={{ backgroundColor: '#1A1A1A' }}>Selecciona un servicio…</option>
            {services.map((s) => (
              <option key={s.id} value={s.name} style={{ backgroundColor: '#1A1A1A' }}>
                {s.name} — {s.price_eur}€
              </option>
            ))}
          </select>
        </div>
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
      {loading ? 'Confirmando...' : 'Confirmar cita'}
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

/* ─── Scissors divider ──────────────────────────────────────── */
function ScissorsDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(201,169,110,0.08)' }} />
      <Scissors size={14} style={{ color: 'rgba(201,169,110,0.3)' }} />
      <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(201,169,110,0.08)' }} />
    </div>
  )
}

/* ─── Desktop summary panel (left col) ─────────────────────── */
interface SummaryPanelProps {
  selectedDate: string | null
  selectedSlot: Slot | null
  name:       string
  phone:      string
  service:    string
  setName:    (v: string) => void
  setPhone:   (v: string) => void
  setService: (v: string) => void
  onConfirm:  () => void
  onChangeDate: () => void
  onChangeSlot: () => void
  loading:  boolean
  error:    string | null
  step:     BookingStep
  services: ServiceItem[]
  barber:   Barber | null
  barbers:  Barber[]
  onSelectBarber: (b: Barber) => void
}

function SummaryPanel({
  selectedDate,
  selectedSlot,
  name,
  phone,
  service,
  setName,
  setPhone,
  setService,
  onConfirm,
  onChangeDate,
  onChangeSlot,
  loading,
  error,
  step,
  services,
  barber,
  barbers,
  onSelectBarber,
}: SummaryPanelProps) {
  const dateLabel = selectedDate
    ? format(parseISO(selectedDate), "d 'de' MMMM, yyyy", { locale: es })
    : null

  const slotLabel = selectedSlot
    ? `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}`
    : null

  const canConfirm =
    step === 'form' &&
    !!selectedDate &&
    !!selectedSlot &&
    name.trim().length >= 2 &&
    phone.replace(/\s/g, '').length === 9 &&
    service.length > 0

  return (
    <div
      style={{
        backgroundColor: '#161310',
        border: '1px solid rgba(201,169,110,0.12)',
        borderRadius: 20,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
      }}
    >
      {/* Barber card */}
      <div
        style={{
          backgroundColor: '#1C1915',
          border: '1px solid rgba(201,169,110,0.12)',
          borderRadius: 16,
          padding: '16px',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: '#2A2520',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <User size={32} weight="duotone" style={{ color: '#C9A96E' }} />
        </div>
        <p style={{ color: '#F2EDE7', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>
          {barber?.name ?? 'Selecciona barbero'}
        </p>
        <p style={{ color: '#5A5450', fontSize: '0.85rem', textAlign: 'center' }}>
          {barber?.title ?? ''}
        </p>
        {barbers.length > 1 && (
          <select
            value={barber?.id ?? ''}
            onChange={(e) => {
              const found = barbers.find((b) => b.id === e.target.value)
              if (found) onSelectBarber(found)
            }}
            style={{
              marginTop: 10,
              width: '100%',
              backgroundColor: '#2A2520',
              border: '1px solid rgba(201,169,110,0.2)',
              color: '#F2EDE7',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23C9A96E' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              paddingRight: '2rem',
            }}
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id} style={{ backgroundColor: '#1A1A1A' }}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Fecha row — clickable */}
      <button
        onClick={onChangeDate}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 12,
          backgroundColor: '#1C1915',
          border: '1px solid rgba(201,169,110,0.15)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarBlank size={16} style={{ color: '#C9A96E', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4A4540', marginBottom: 2 }}>
              FECHA SELECCIONADA
            </p>
            <p style={{ color: selectedDate ? '#F2EDE7' : '#3A3530', fontSize: '0.95rem', fontWeight: 500 }}>
              {dateLabel ?? 'Selecciona una fecha'}
            </p>
          </div>
        </div>
        <CaretRight size={14} style={{ color: '#C9A96E', flexShrink: 0 }} />
      </button>

      {/* Hora row — clickable */}
      <button
        onClick={onChangeSlot}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 12,
          backgroundColor: '#1C1915',
          border: '1px solid rgba(201,169,110,0.15)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={16} style={{ color: '#C9A96E', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4A4540', marginBottom: 2 }}>
              HORA SELECCIONADA
            </p>
            <p style={{ color: selectedSlot ? '#F2EDE7' : '#3A3530', fontSize: '0.95rem', fontWeight: 500 }}>
              {slotLabel ?? 'Selecciona un horario'}
            </p>
          </div>
        </div>
        <CaretRight size={14} style={{ color: '#C9A96E', flexShrink: 0 }} />
      </button>

      {/* Scissors divider + form fields — only at form step */}
      {step === 'form' && (
        <>
          <ScissorsDivider />
          <FormFields
            name={name} phone={phone} service={service}
            setName={setName} setPhone={setPhone} setService={setService}
            services={services}
          />
        </>
      )}

      {error && <ErrorBanner message={error} />}

      {/* CTA */}
      {step === 'form' ? (
        <ConfirmButton canConfirm={canConfirm} loading={loading} onClick={onConfirm} />
      ) : (
        <p className="text-center text-sm" style={{ color: '#3A3530' }}>
          Selecciona fecha y hora
        </p>
      )}

      {/* Security badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 'auto',
          paddingTop: 12,
        }}
      >
        <ShieldCheck size={13} style={{ color: '#3A3530' }} />
        <span style={{ fontSize: '0.72rem', color: '#3A3530' }}>
          Tus datos están protegidos y encriptados
        </span>
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
  const router = useRouter()

  /* State */
  const [step,         setStep]         = useState<BookingStep>('date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [user,      setUser]      = useState<SupabaseUser | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [slotRefreshKey, setSlotRefreshKey] = useState(0)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [showMultiBookingWarning, setShowMultiBookingWarning] = useState(false)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)

  /* ── Fetch services from API ──────────────────────────────── */
  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.services) && d.services.length > 0) setServices(d.services)
        else setServices(FALLBACK_SERVICES)
      })
      .catch(() => setServices(FALLBACK_SERVICES))
  }, [])

  /* ── Fetch barbers from API ───────────────────────────────── */
  useEffect(() => {
    fetch('/api/barbers')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.barbers) && d.barbers.length > 0) {
          setBarbers(d.barbers)
          setSelectedBarber(d.barbers[0])
        }
      })
      .catch(() => {})
  }, [])

  /* ── Auth + setup ────────────────────────────────────────── */
  useEffect(() => {
    const supabase = createClient()

    const setupUser = async (currentUser: SupabaseUser | null, event?: string) => {
      setUser(currentUser)

      if (!currentUser) return

      // Prefill from profile (don't overwrite if user already typed)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', currentUser.id)
        .maybeSingle()
      if (profile?.full_name) setName((n) => n || profile.full_name)
      if (profile?.phone)     setPhone((p) => p || profile.phone)

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
    ? `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}`
    : null

  /* Formatted day label for slots panel header */
  const formattedDayLabel = selectedDate
    ? format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })
    : ''

  /* ── Navigation handlers ─────────────────────────────────── */
  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setError(null)
    setStep('slot')
  }

  async function handleSelectSlot(slot: Slot) {
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

    // Check for existing confirmed future appointments
    try {
      const res = await fetch('/api/appointments/mine')
      const data = await res.json()
      const futureConfirmed = Array.isArray(data.appointments)
        ? data.appointments.filter((a: { status: string; slot_date: string }) =>
            a.status === 'confirmed' && a.slot_date >= new Date().toISOString().split('T')[0]
          )
        : []
      if (futureConfirmed.length > 0) {
        setShowMultiBookingWarning(true)
        return
      }
    } catch {
      // Network error — proceed without warning
    }

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

  function handleWarningContinue() {
    setShowMultiBookingWarning(false)
    setStep('form')
  }

  function handleWarningViewCitas() {
    setShowMultiBookingWarning(false)
    router.push('/mis-citas')
  }

  /* ── Confirm booking ─────────────────────────────────────── */
  async function handleConfirm() {
    if (!selectedDate || !selectedSlot || !user) return
    if (name.trim().length < 2 || phone.trim().length < 6) return

    setLoading(true)
    setError(null)

    const result = await bookAppointment(
      {
        slot_date:       selectedDate,
        slot_start_time: selectedSlot.start_time.slice(0, 5),
        slot_end_time:   selectedSlot.end_time.slice(0, 5),
        client_name:     name.trim(),
        client_phone:    phone.trim(),
        notes:           service || undefined,
      },
      selectedBarber?.id ?? null,
    )

    setLoading(false)

    if ('error' in result && result.error) {
      if (result.error === 'SLOT_TAKEN' || result.error === 'SLOT_NOT_FOUND') {
        // Slot taken while user was filling form — refresh list and go back
        setSlotRefreshKey((k) => k + 1)
        setSelectedSlot(null)
        setStep('slot')
        setError('Ese hueco ya fue reservado. Elige otro horario.')
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
    setService('')
    setError(null)
  }

  /* ── Handle barber change (reset date/slot) ──────────────── */
  function handleSelectBarber(barber: Barber) {
    setSelectedBarber(barber)
    setSelectedDate(null)
    setSelectedSlot(null)
    setError(null)
    setStep('date')
    setSlotRefreshKey((k) => k + 1)
  }

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  const canConfirm =
    step === 'form' &&
    !!selectedDate &&
    !!selectedSlot &&
    name.trim().length >= 2 &&
    phone.replace(/\s/g, '').length === 9 &&
    service.length > 0

  return (
    <section
      id="reservar"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#161310' }}
    >
      {/* Multi-booking warning dialog */}
      {showMultiBookingWarning && (
        <MultiBookingWarning
          onContinue={handleWarningContinue}
          onViewCitas={handleWarningViewCitas}
        />
      )}

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-10 text-center"
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

            {/* Barber mini-card — all non-confirmed steps */}
            {step !== 'confirmed' && selectedBarber && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.12)' }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#2A2520',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <User size={18} weight="duotone" style={{ color: '#C9A96E' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F2EDE7' }}>
                    {selectedBarber.name}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#5A5450' }}>
                    {selectedBarber.title}
                  </p>
                </div>
                {barbers.length > 1 && (
                  <select
                    value={selectedBarber.id}
                    onChange={(e) => {
                      const found = barbers.find((b) => b.id === e.target.value)
                      if (found) handleSelectBarber(found)
                    }}
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: '#2A2520',
                      border: '1px solid rgba(201,169,110,0.2)',
                      color: '#C9A96E',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: '0.78rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id} style={{ backgroundColor: '#1A1A1A' }}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

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
                style={{
                  backgroundColor: '#161310',
                  border: '1px solid rgba(201,169,110,0.12)',
                  borderRadius: 20,
                  padding: '24px',
                }}
              >
                <BookingCalendar
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  barberId={selectedBarber?.id}
                />
              </div>
            )}

            {/* Step: slot */}
            {step === 'slot' && (
              <div
                style={{
                  backgroundColor: '#161310',
                  border: '1px solid rgba(201,169,110,0.12)',
                  borderRadius: 20,
                  padding: '20px 24px',
                }}
              >
                {dateLabel && (
                  <BackButton
                    onClick={handleBackToDate}
                    label={`Cambiar fecha · ${dateLabel}`}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Clock size={18} style={{ color: '#C9A96E' }} />
                  <div>
                    <p style={{ color: '#F2EDE7', fontWeight: 600, fontSize: '1rem' }}>Elige una hora</p>
                    <p style={{ color: '#5A5450', fontSize: '0.8rem', textTransform: 'capitalize' }}>{formattedDayLabel}</p>
                  </div>
                </div>
                <TimeSlotPicker
                  date={selectedDate!}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                  refreshKey={slotRefreshKey}
                  barberId={selectedBarber?.id}
                />
                {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
              </div>
            )}

            {/* Step: form */}
            {step === 'form' && (
              <div
                style={{
                  backgroundColor: '#161310',
                  border: '1px solid rgba(201,169,110,0.12)',
                  borderRadius: 20,
                  padding: '20px',
                }}
              >
                {dateLabel && timeLabel && (
                  <BackButton
                    onClick={handleBackToSlot}
                    label={`${dateLabel} · ${timeLabel}`}
                  />
                )}

                <ScissorsDivider />
                <div className="mt-3">
                  <FormFields
                    name={name} phone={phone} service={service}
                    setName={setName} setPhone={setPhone} setService={setService}
                    services={services}
                  />
                </div>

                {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

                <ConfirmButton
                  canConfirm={canConfirm}
                  loading={loading}
                  onClick={handleConfirm}
                />

                {/* Security badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                  <ShieldCheck size={13} style={{ color: '#3A3530' }} />
                  <span style={{ fontSize: '0.72rem', color: '#3A3530' }}>
                    Tus datos están protegidos y encriptados
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
              DESKTOP — 2-col layout (lg+)
          ════════════════════════════════════════ */}
          <div className="hidden lg:block">

            {/* Step indicator — visible on desktop too */}
            {(step === 'date' || step === 'slot' || step === 'form') && (
              <StepIndicator step={step} />
            )}

            <div className="grid grid-cols-[420px_1fr] gap-6">

              {/* LEFT: summary panel or confirmed state */}
              <div className="min-h-[400px]">
                {step === 'confirmed' && confirmedAppointment ? (
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
                    name={name} phone={phone} service={service}
                    setName={setName} setPhone={setPhone} setService={setService}
                    onConfirm={handleConfirm}
                    onChangeDate={handleBackToDate}
                    onChangeSlot={handleBackToSlot}
                    loading={loading}
                    error={error}
                    step={step}
                    services={services}
                    barber={selectedBarber}
                    barbers={barbers}
                    onSelectBarber={handleSelectBarber}
                  />
                )}
              </div>

              {/* RIGHT: calendar + slots stacked (hidden in confirmed state) */}
              {step !== 'confirmed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Calendar */}
                  <div
                    style={{
                      backgroundColor: '#F8F5F0',
                      border: '1px solid rgba(201,169,110,0.15)',
                      borderRadius: 20,
                      padding: '24px',
                    }}
                  >
                    <BookingCalendar
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                      barberId={selectedBarber?.id}
                    />
                  </div>

                  {/* Time slots — only when date selected */}
                  {selectedDate && (
                    <div
                      style={{
                        backgroundColor: '#161310',
                        border: '1px solid rgba(201,169,110,0.12)',
                        borderRadius: 20,
                        padding: '20px 24px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <Clock size={18} style={{ color: '#C9A96E' }} />
                        <div>
                          <p style={{ color: '#F2EDE7', fontWeight: 600, fontSize: '1rem' }}>Elige una hora</p>
                          <p style={{ color: '#5A5450', fontSize: '0.8rem', textTransform: 'capitalize' }}>{formattedDayLabel}</p>
                        </div>
                      </div>
                      <TimeSlotPicker
                        date={selectedDate}
                        selectedSlot={selectedSlot}
                        onSelectSlot={handleSelectSlot}
                        refreshKey={slotRefreshKey}
                        barberId={selectedBarber?.id}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                        <ShieldCheck size={13} style={{ color: '#3A3530' }} />
                        <span style={{ fontSize: '0.75rem', color: '#3A3530' }}>Citas rápidas · Confirmación inmediata</span>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
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
