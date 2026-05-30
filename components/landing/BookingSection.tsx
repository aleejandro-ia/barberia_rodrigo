'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { CalendarBlank, Clock, User, Phone } from '@phosphor-icons/react'
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

interface Slot {
  id: string
  start_time: string
  end_time: string
}

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: 'Este hueco ya fue reservado. Elige otro.',
  ALREADY_HAS_BOOKING: 'Ya tienes una cita activa.',
  VALIDATION_ERROR: 'Revisa los datos introducidos.',
  UNAUTHORIZED: 'Sesión expirada. Recarga la página.',
  SLOT_NOT_FOUND: 'El hueco ya no está disponible.',
  DEFAULT: 'Algo falló. Inténtalo de nuevo.',
}

/* ─────────────────────────────────────────────────
   Left summary / form panel
───────────────────────────────────────────────── */
interface PanelProps {
  selectedDate: string | null
  selectedSlot: Slot | null
  name: string
  phone: string
  notes: string
  setName: (v: string) => void
  setPhone: (v: string) => void
  setNotes: (v: string) => void
  onConfirm: () => void
  loading: boolean
  error: string | null
  confirmed: boolean
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border: '1px solid rgba(201,169,110,0.2)',
  color: '#F2EDE7',
  borderRadius: '0.75rem',
  padding: '0.65rem 0.875rem',
  fontSize: '0.8125rem',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
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
  loading,
  error,
}: PanelProps) {
  const dateLabel =
    selectedDate
      ? format(parseISO(selectedDate), "d 'de' MMMM, yyyy", { locale: es })
      : null

  const canConfirm =
    !!selectedDate && !!selectedSlot && name.trim().length >= 2 && phone.trim().length >= 6

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#161310',
        border: '1px solid rgba(201,169,110,0.12)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(201,169,110,0.08)' }}
      >
        {/* Barber avatar placeholder */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(201,169,110,0.1)',
            border: '1px solid rgba(201,169,110,0.25)',
          }}
        >
          <User size={18} weight="duotone" style={{ color: '#C9A96E' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F2EDE7' }}>
            Rodrigo Fernández
          </p>
          <p className="text-xs" style={{ color: '#5A5450' }}>
            Maestro Barbero
          </p>
        </div>
      </div>

      {/* Booking info */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Date */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: selectedDate
              ? 'rgba(201,169,110,0.06)'
              : 'rgba(255,255,255,0.02)',
            border: selectedDate
              ? '1px solid rgba(201,169,110,0.15)'
              : '1px dashed rgba(255,255,255,0.06)',
          }}
        >
          <CalendarBlank
            size={16}
            weight="duotone"
            style={{ color: selectedDate ? '#C9A96E' : '#3A3530', flexShrink: 0 }}
          />
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#4A4540' }}>
              Fecha
            </p>
            <p className="text-sm font-medium capitalize" style={{ color: selectedDate ? '#F2EDE7' : '#3A3530' }}>
              {dateLabel ?? 'Selecciona una fecha'}
            </p>
          </div>
        </div>

        {/* Time */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: selectedSlot
              ? 'rgba(201,169,110,0.06)'
              : 'rgba(255,255,255,0.02)',
            border: selectedSlot
              ? '1px solid rgba(201,169,110,0.15)'
              : '1px dashed rgba(255,255,255,0.06)',
          }}
        >
          <Clock
            size={16}
            weight="duotone"
            style={{ color: selectedSlot ? '#C9A96E' : '#3A3530', flexShrink: 0 }}
          />
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#4A4540' }}>
              Hora
            </p>
            <p className="text-sm font-medium" style={{ color: selectedSlot ? '#F2EDE7' : '#3A3530' }}>
              {selectedSlot ? `${selectedSlot.start_time.slice(0, 5)} – ${selectedSlot.end_time.slice(0, 5)}` : 'Selecciona un horario'}
            </p>
          </div>
        </div>

        {/* Form — shown once date+slot selected */}
        {selectedDate && selectedSlot && (
          <div className="flex flex-col gap-2.5 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#5A5450' }}>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                maxLength={100}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#5A5450' }}>Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                maxLength={20}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#5A5450' }}>Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tipo de corte, preferencias..."
                maxLength={400}
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-3 py-2.5 rounded-xl text-xs"
            style={{
              backgroundColor: 'rgba(255,80,80,0.07)',
              border: '1px solid rgba(255,80,80,0.18)',
              color: '#FF8080',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Confirm CTA */}
      <div className="mt-auto px-5 pb-5">
        <button
          onClick={onConfirm}
          disabled={!canConfirm || loading}
          className="w-full py-3.5 rounded-full text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            backgroundColor: canConfirm && !loading ? '#C9A96E' : 'rgba(201,169,110,0.15)',
            color: canConfirm && !loading ? '#0E0B08' : '#5A5450',
            cursor: canConfirm && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Confirmando...' : 'Confirmar cita →'}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Main booking section
───────────────────────────────────────────────── */
export default function BookingSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.full_name) setName(data.full_name)
            if (data?.phone) setPhone(data.phone)
          })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setError(null)
  }

  function handleSelectSlot(slot: Slot) {
    if (!user) {
      setPendingSlot(slot)
      setAuthModalOpen(true)
    } else {
      setSelectedSlot(slot)
      setError(null)
    }
  }

  function handleAuthSuccess() {
    setAuthModalOpen(false)
    if (pendingSlot) {
      setSelectedSlot(pendingSlot)
      setPendingSlot(null)
    }
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot || name.trim().length < 2 || phone.trim().length < 6) return
    if (!user) { setAuthModalOpen(true); return }

    setLoading(true)
    setError(null)
    const result = await bookAppointment({
      slot_date: selectedDate,
      slot_start_time: selectedSlot.start_time,
      slot_end_time: selectedSlot.end_time,
      client_name: name.trim(),
      client_phone: phone.trim(),
      notes: notes.trim() || undefined,
    })
    setLoading(false)

    if ('error' in result && result.error) {
      setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.DEFAULT)
      return
    }
    if ('appointment' in result && result.appointment) {
      setConfirmedAppointment(result.appointment as Appointment)
      setShowConfirmation(true)
    }
  }

  function handleReset() {
    setSelectedDate(null)
    setSelectedSlot(null)
    setConfirmedAppointment(null)
    setShowConfirmation(false)
    setName('')
    setPhone('')
    setNotes('')
    setError(null)
  }

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
          <p className="text-xs font-medium uppercase tracking-[0.25em] mb-4" style={{ color: '#C9A96E' }}>
            Reserva Online
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F2EDE7' }}
          >
            Elige tu fecha y hora
          </h2>
        </motion.div>

        {/* Confirmation state */}
        {showConfirmation && confirmedAppointment ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="rounded-2xl p-8"
            style={{
              backgroundColor: '#161310',
              border: '1px solid rgba(201,169,110,0.12)',
            }}
          >
            <BookingConfirmation
              date={confirmedAppointment.slot_date}
              startTime={confirmedAppointment.slot_start_time}
              onBookAnother={handleReset}
            />
          </motion.div>
        ) : (
          /* Main booking layout — 3 column on desktop */
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5"
          >
            {/* LEFT: Summary + form panel */}
            <div className="min-h-[400px]">
              <SummaryPanel
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                name={name}
                phone={phone}
                notes={notes}
                setName={setName}
                setPhone={setPhone}
                setNotes={setNotes}
                onConfirm={handleConfirm}
                loading={loading}
                error={error}
                confirmed={showConfirmation}
              />
            </div>

            {/* RIGHT: Calendar + time slots */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#161310',
                border: '1px solid rgba(201,169,110,0.12)',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_auto]">
                {/* Calendar */}
                <div className="p-6 md:p-8">
                  <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: '#4A4540' }}>
                    {selectedDate ? 'Fecha seleccionada' : 'Selecciona un día'}
                  </p>
                  <BookingCalendar
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                  />
                </div>

                {/* Vertical divider */}
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
                  </>
                )}

                {/* Time slots */}
                {selectedDate && (
                  <div className="p-6 md:p-8 md:min-w-[180px]">
                    <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: '#4A4540' }}>
                      Horarios
                    </p>
                    <TimeSlotPicker
                      date={selectedDate}
                      selectedSlot={selectedSlot}
                      onSelectSlot={handleSelectSlot}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile step hint */}
        {!selectedDate && !showConfirmation && (
          <p className="mt-6 text-center text-xs lg:hidden" style={{ color: '#3A3530' }}>
            Selecciona fecha → hora → confirma
          </p>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </section>
  )
}
