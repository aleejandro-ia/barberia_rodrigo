'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth/AuthModal'
import BookingCalendar from './BookingCalendar'
import TimeSlotPicker from './TimeSlotPicker'
import BookingForm from './BookingForm'
import BookingConfirmation from './BookingConfirmation'
import BookingReview from './BookingReview'
import type { Appointment } from '@/types'
import type { User } from '@supabase/supabase-js'

type Step = 'calendar' | 'slots' | 'form' | 'review' | 'confirmation'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

interface UserProfile {
  full_name?: string
  phone?: string
}

/* Step label map — shown in the pill indicator */
const STEP_LABELS: Record<Exclude<Step, 'confirmation'>, string> = {
  calendar: 'Fecha',
  slots: 'Hora',
  form: 'Datos',
  review: 'Revisar',
}
const STEP_ORDER: Exclude<Step, 'confirmation'>[] = [
  'calendar',
  'slots',
  'form',
  'review',
]

export default function BookingSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  const [step, setStep] = useState<Step>('calendar')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<Appointment | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    phone: string
    notes: string
  } | null>(null)

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthChecked(true)
      if (user) {
        supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setProfile(data)
          })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setProfile(data)
          })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('slots')
  }

  function handleSelectSlot(slot: Slot) {
    setSelectedSlot(slot)
    if (!user) {
      setAuthModalOpen(true)
    } else {
      setStep('form')
    }
  }

  function handleAuthSuccess() {
    setAuthModalOpen(false)
    if (selectedSlot) setStep('form')
  }

  function handleFormReady(data: { name: string; phone: string; notes: string }) {
    setFormData(data)
    setStep('review')
  }

  function handleBookingConfirmed(appointment: Appointment) {
    setConfirmedAppointment(appointment)
    setStep('confirmation')
  }

  function handleReset() {
    setStep('calendar')
    setSelectedDate(null)
    setSelectedSlot(null)
    setConfirmedAppointment(null)
    setFormData(null)
  }

  /* ── Step indicator ── */
  const currentStepIndex = step !== 'confirmation' ? STEP_ORDER.indexOf(step) : -1

  return (
    <section
      id="reservar"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center"
        >
          <p
            className="text-xs font-medium uppercase tracking-[0.2em] mb-4"
            style={{ color: '#C9A96E' }}
          >
            Reserva online
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            Elige tu fecha y hora
          </h2>
        </motion.div>

        {/* Step indicator pills */}
        {step !== 'confirmation' && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEP_ORDER.map((s, i) => {
              const isDone = i < currentStepIndex
              const isActive = s === step
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all duration-300"
                      style={{
                        backgroundColor: isDone
                          ? '#C9A96E'
                          : isActive
                            ? 'rgba(201,169,110,0.15)'
                            : 'rgba(255,255,255,0.04)',
                        border: isDone
                          ? '1px solid #C9A96E'
                          : isActive
                            ? '1px solid rgba(201,169,110,0.6)'
                            : '1px solid rgba(255,255,255,0.08)',
                        color: isDone
                          ? '#0A0A0A'
                          : isActive
                            ? '#C9A96E'
                            : '#444',
                      }}
                    >
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span
                      className="text-xs font-medium hidden sm:block"
                      style={{
                        color: isDone
                          ? '#C9A96E'
                          : isActive
                            ? '#F5F5F5'
                            : '#444',
                      }}
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div
                      className="w-6 h-px transition-all duration-300"
                      style={{
                        backgroundColor: isDone
                          ? '#C9A96E'
                          : 'rgba(255,255,255,0.06)',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Main booking card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#111111',
            border: '1px solid rgba(201,169,110,0.12)',
          }}
        >
          {/* ── STEP: calendar ── */}
          {step === 'calendar' && (
            <div className="p-6 md:p-10 max-w-md mx-auto">
              <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: '#555' }}>
                Selecciona un día disponible
              </p>
              <BookingCalendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </div>
          )}

          {/* ── STEP: slots — 2-col on desktop ── */}
          {step === 'slots' && selectedDate && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
              {/* Calendar column */}
              <div className="p-6 md:p-10">
                <p
                  className="text-xs font-medium uppercase tracking-widest mb-6"
                  style={{ color: '#555' }}
                >
                  Fecha seleccionada
                </p>
                <BookingCalendar
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                />
              </div>

              {/* Divider */}
              <div
                className="hidden md:block self-stretch my-8"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              />
              <div className="md:hidden h-px mx-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

              {/* Slots column */}
              <div className="p-6 md:p-10 flex flex-col gap-6">
                <button
                  onClick={() => setStep('calendar')}
                  className="text-xs flex items-center gap-1 transition-colors w-fit"
                  style={{ color: '#555' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A96E')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                >
                  ← Cambiar día
                </button>

                <TimeSlotPicker
                  date={selectedDate}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                />

                {selectedSlot && (
                  <button
                    onClick={() => {
                      if (!user) {
                        setAuthModalOpen(true)
                      } else {
                        setStep('form')
                      }
                    }}
                    className="w-full py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
                  >
                    Continuar con las {selectedSlot.start_time.slice(0, 5)}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: form ── */}
          {step === 'form' && selectedDate && selectedSlot && (
            <div className="p-6 md:p-10 max-w-lg mx-auto w-full">
              <button
                onClick={() => setStep('slots')}
                className="text-xs mb-6 flex items-center gap-1 transition-colors"
                style={{ color: '#555' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A96E')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
              >
                ← Cambiar horario
              </button>

              {/* Selected slot summary pill */}
              <div
                className="mb-7 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
                style={{
                  backgroundColor: 'rgba(201,169,110,0.06)',
                  border: '1px solid rgba(201,169,110,0.15)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#C9A96E' }} />
                <span style={{ color: '#C9A96E' }}>
                  {selectedDate} · {selectedSlot.start_time.slice(0, 5)}
                </span>
              </div>

              <BookingForm
                date={selectedDate}
                slot={selectedSlot}
                initialName={profile?.full_name || ''}
                initialPhone={profile?.phone || ''}
                onReview={handleFormReady}
              />
            </div>
          )}

          {/* ── STEP: review ── */}
          {step === 'review' && selectedDate && selectedSlot && formData && (
            <div className="p-6 md:p-10 max-w-lg mx-auto w-full">
              <BookingReview
                date={selectedDate}
                slot={selectedSlot}
                formData={formData}
                onBack={() => setStep('form')}
                onConfirmed={handleBookingConfirmed}
              />
            </div>
          )}

          {/* ── STEP: confirmation ── */}
          {step === 'confirmation' && confirmedAppointment && (
            <div className="p-6 md:p-10">
              <BookingConfirmation
                date={confirmedAppointment.slot_date}
                startTime={confirmedAppointment.slot_start_time}
                onBookAnother={handleReset}
              />
            </div>
          )}
        </motion.div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </section>
  )
}
