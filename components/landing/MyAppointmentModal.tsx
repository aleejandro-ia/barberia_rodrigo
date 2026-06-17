'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, CalendarBlank, Clock, WhatsappLogo } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { cancelAppointment } from '@/actions/appointments'
import { cleanPhone } from '@/lib/whatsapp'

interface Appointment {
  id: string
  slot_date: string
  slot_start_time: string
  slot_end_time: string
  client_name: string
  status: string
}

interface MyAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginNeeded: () => void
  userId: string | null
  /** Barber phone from booking_settings.whatsapp_phone (admin-editable). */
  whatsappPhone?: string
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function MyAppointmentModal({ isOpen, onClose, onLoginNeeded, userId, whatsappPhone }: MyAppointmentModalProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    if (!isOpen || !userId) return
    setLoading(true)
    setCancelled(false)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('appointments')
      .select('id, slot_date, slot_start_time, slot_end_time, client_name, status')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setAppointment(data)
        setLoading(false)
      })
  }, [isOpen, userId])

  async function handleCancel() {
    if (!appointment) return
    setCancelling(true)
    const result = await cancelAppointment(appointment.id)
    setCancelling(false)
    if ('success' in result) {
      setCancelled(true)
      setAppointment(null)
    }
  }

  const whatsapp = cleanPhone(whatsappPhone || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '34600000000')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-4 sm:right-8 z-50 w-full max-w-sm"
          >
            <div
              className="rounded-2xl p-5 shadow-2xl"
              style={{
                backgroundColor: '#111111',
                border: '1px solid rgba(201,169,110,0.2)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
                  Mi próxima cita
                </h3>
                <button onClick={onClose} style={{ color: '#555' }} className="hover:text-white transition-colors">
                  <X size={18} weight="bold" />
                </button>
              </div>

              {loading ? (
                <div className="py-6 flex justify-center">
                  <div
                    className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
                  />
                </div>
              ) : cancelled ? (
                <div className="py-4 text-center">
                  <p className="text-sm" style={{ color: '#888' }}>Cita cancelada correctamente.</p>
                  <button
                    onClick={onClose}
                    className="mt-3 text-sm font-medium transition-colors"
                    style={{ color: '#C9A96E' }}
                  >
                    Reservar nueva cita
                  </button>
                </div>
              ) : appointment ? (
                <div className="flex flex-col gap-3">
                  {/* Date */}
                  <div
                    className="flex items-start gap-3 rounded-xl p-3.5"
                    style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.12)' }}
                  >
                    <CalendarBlank size={18} weight="duotone" style={{ color: '#C9A96E', marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <p className="text-sm font-medium capitalize" style={{ color: '#F5F5F5' }}>
                        {formatDate(appointment.slot_date)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={13} style={{ color: '#888' }} />
                        <p className="text-xs" style={{ color: '#888' }}>
                          {appointment.slot_start_time.slice(0, 5)} – {appointment.slot_end_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs" style={{ color: '#666' }}>
                    Reservada a nombre de <span style={{ color: '#F5F5F5' }}>{appointment.client_name}</span>
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 py-2 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                      style={{
                        border: '1px solid rgba(255,80,80,0.3)',
                        color: '#FF8080',
                        backgroundColor: 'rgba(255,80,80,0.06)',
                      }}
                    >
                      {cancelling ? 'Cancelando...' : 'Cancelar cita'}
                    </button>
                    {whatsapp && (
                      <a
                        href={`https://wa.me/${whatsapp}?text=Hola%20Rodrigo%2C%20tengo%20una%20cita%20el%20${appointment.slot_date}%20a%20las%20${appointment.slot_start_time.slice(0,5)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#25D366', color: '#fff' }}
                      >
                        <WhatsappLogo size={14} weight="fill" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center flex flex-col gap-3">
                  <p className="text-sm" style={{ color: '#888' }}>No tienes citas próximas.</p>
                  <button
                    onClick={onClose}
                    className="mx-auto px-5 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
                  >
                    Reservar ahora
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
