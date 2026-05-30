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

export default function BookingSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  const [step, setStep] = useState<Step>('calendar')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState<{ name: string; phone: string; notes: string } | null>(null)

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    setStep('form')
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

  const STEPS: Step[] = ['calendar', 'slots', 'form', 'review', 'confirmation']

  return (
    <section
      id="reservar"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#C9A96E' }}>
            Reserva online
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            Tu proxima cita
          </h2>
        </motion.div>

        {/* Step indicator */}
        {step !== 'confirmation' && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.filter((s) => s !== 'confirmation').map((s, i) => {
              const stepIndex = STEPS.indexOf(step)
              const thisIndex = STEPS.indexOf(s)
              const isActive = s === step
              const isDone = thisIndex < stepIndex
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                    style={{
                      backgroundColor: isDone
                        ? '#C9A96E'
                        : isActive
                        ? 'rgba(201,169,110,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      border: isActive
                        ? '1px solid rgba(201,169,110,0.6)'
                        : isDone
                        ? '1px solid #C9A96E'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: isDone ? '#0A0A0A' : isActive ? '#C9A96E' : '#555',
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className="w-8 h-px transition-all duration-300"
                      style={{ backgroundColor: isDone ? '#C9A96E' : 'rgba(255,255,255,0.08)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="rounded-2xl p-6 md:p-8"
          style={{
            backgroundColor: '#111111',
            border: '1px solid rgba(201,169,110,0.12)',
          }}
        >
          {step === 'calendar' && (
            <div>
              <h3 className="text-sm font-medium mb-6" style={{ color: '#888888' }}>
                Selecciona un dia disponible
              </h3>
              <BookingCalendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </div>
          )}

          {step === 'slots' && selectedDate && (
            <div>
              <button
                onClick={() => setStep('calendar')}
                className="text-xs mb-5 flex items-center gap-1 transition-colors"
                style={{ color: '#888888' }}
              >
                &larr; Cambiar dia
              </button>
              <TimeSlotPicker
                date={selectedDate}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
              />
              {selectedSlot && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (!user) {
                        setAuthModalOpen(true)
                      } else {
                        setStep('form')
                      }
                    }}
                    className="w-full py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
                  >
                    Continuar con las {selectedSlot.start_time.slice(0, 5)}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'form' && selectedDate && selectedSlot && (
            <div>
              <button
                onClick={() => setStep('slots')}
                className="text-xs mb-5 flex items-center gap-1 transition-colors"
                style={{ color: '#888888' }}
              >
                &larr; Cambiar horario
              </button>
              <div
                className="mb-6 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: 'rgba(201,169,110,0.06)',
                  border: '1px solid rgba(201,169,110,0.15)',
                  color: '#C9A96E',
                }}
              >
                {selectedDate} a las {selectedSlot.start_time.slice(0, 5)}
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

          {step === 'review' && selectedDate && selectedSlot && formData && (
            <BookingReview
              date={selectedDate}
              slot={selectedSlot}
              formData={formData}
              onBack={() => setStep('form')}
              onConfirmed={handleBookingConfirmed}
            />
          )}

          {step === 'confirmation' && confirmedAppointment && (
            <BookingConfirmation
              date={confirmedAppointment.slot_date}
              startTime={confirmedAppointment.slot_start_time}
              onBookAnother={handleReset}
            />
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
