'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Scissors, CalendarBlank } from '@phosphor-icons/react'
import type { Appointment, BookingSettings, Barber } from '@/types'
import MisCitasCard from '@/components/client/MisCitasCard'

const DEFAULT_SETTINGS: Partial<BookingSettings> = {
  cancel_hours_before: 3,
  reschedule_hours_before: 3,
  whatsapp_phone: '34600000000',
  business_name: 'BG Barber',
  whatsapp_cancel_msg: 'Hola, necesito cancelar mi cita.',
  whatsapp_reschedule_msg: 'Hola, me gustaría cambiar mi cita.',
}

function isUpcomingConfirmed(appt: Appointment): boolean {
  const today = new Date().toISOString().split('T')[0]
  return appt.status === 'confirmed' && appt.slot_date >= today
}

export default function MisCitasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [fetchError, setFetchError] = useState(false)
  const [settings, setSettings] = useState<Partial<BookingSettings>>(DEFAULT_SETTINGS)
  const [barberMap, setBarberMap] = useState<Map<string, string>>(new Map())
  const [barberCount, setBarberCount] = useState(0)

  // Auth check
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthenticated(!!user)
      setAuthChecked(true)
      if (!user) setLoading(false)
    })
  }, [])

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await fetch('/api/appointments/mine')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setAppointments(data.appointments ?? [])
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch booking settings from /api/booking-settings or fallback
  useEffect(() => {
    fetch('/api/booking-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) {
          setSettings({
            cancel_hours_before: Number(data.settings.cancel_hours_before ?? 3),
            reschedule_hours_before: Number(data.settings.reschedule_hours_before ?? 3),
            whatsapp_phone: data.settings.whatsapp_phone ?? DEFAULT_SETTINGS.whatsapp_phone,
            business_name: data.settings.business_name ?? DEFAULT_SETTINGS.business_name,
            whatsapp_cancel_msg: data.settings.whatsapp_cancel_msg ?? DEFAULT_SETTINGS.whatsapp_cancel_msg,
            whatsapp_reschedule_msg: data.settings.whatsapp_reschedule_msg ?? DEFAULT_SETTINGS.whatsapp_reschedule_msg,
          })
        }
      })
      .catch(() => {/* use defaults */})
  }, [])

  // Fetch barbers for name display
  useEffect(() => {
    fetch('/api/barbers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list: Barber[] = data?.barbers ?? []
        setBarberCount(list.length)
        const map = new Map<string, string>()
        for (const b of list) map.set(b.id, b.name)
        setBarberMap(map)
      })
      .catch(() => {/* silent */})
  }, [])

  useEffect(() => {
    if (authChecked && authenticated) {
      fetchAppointments()
    }
  }, [authChecked, authenticated, fetchAppointments])

  // Not authenticated
  if (authChecked && !authenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: '#0E0B08' }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-sm w-full"
          style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)' }}
        >
          <Scissors size={32} weight="duotone" style={{ color: '#C9A96E', margin: '0 auto 16px' }} />
          <h1 className="text-lg font-semibold mb-2" style={{ color: '#F2EDE7' }}>
            Acceso requerido
          </h1>
          <p className="text-sm mb-6" style={{ color: '#7A7268' }}>
            Debes iniciar sesión para ver tus citas.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  const upcomingAppointments = appointments.filter(isUpcomingConfirmed)
  const nextAppointment = upcomingAppointments[0] ?? null
  // próxima = first upcoming confirmed; historial = everything else
  const restUpcoming = upcomingAppointments.slice(1)
  const past = appointments.filter((a) => !isUpcomingConfirmed(a))
  const historial = [...restUpcoming, ...past].sort((a, b) => {
    const dtA = new Date(`${a.slot_date}T${a.slot_start_time}`).getTime()
    const dtB = new Date(`${b.slot_date}T${b.slot_start_time}`).getTime()
    return dtB - dtA
  })

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0E0B08' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{
          backgroundColor: 'rgba(14,11,8,0.95)',
          borderBottom: '1px solid rgba(201,169,110,0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150"
          style={{
            color: '#C9A96E',
            backgroundColor: 'rgba(201,169,110,0.08)',
            border: '1px solid rgba(201,169,110,0.15)',
          }}
          aria-label="Volver al inicio"
        >
          <ArrowLeft size={16} weight="bold" />
        </button>
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#F2EDE7' }}>
            Mis citas
          </h1>
          {!loading && !fetchError && (
            <p className="text-xs" style={{ color: '#7A7268' }}>
              {appointments.length === 0
                ? 'Sin citas'
                : `${appointments.length} cita${appointments.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto flex flex-col gap-8">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
            />
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: '#161310', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-sm mb-4" style={{ color: '#EF4444' }}>
              No se pudieron cargar tus citas.
            </p>
            <button
              onClick={fetchAppointments}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                color: '#C9A96E',
                border: '1px solid rgba(201,169,110,0.25)',
                backgroundColor: 'rgba(201,169,110,0.06)',
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && appointments.length === 0 && (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
            style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(201,169,110,0.08)' }}
            >
              <CalendarBlank size={28} weight="duotone" style={{ color: '#C9A96E' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold mb-1" style={{ color: '#F2EDE7' }}>
                Todavía no tienes citas
              </h2>
              <p className="text-sm" style={{ color: '#7A7268' }}>
                Reserva tu primera cita en BG Barber.
              </p>
            </div>
            <button
              onClick={() => router.push('/#reservar')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
              style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
            >
              Reservar ahora
            </button>
          </div>
        )}

        {/* Próxima cita */}
        {!loading && !fetchError && nextAppointment && (
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#C9A96E' }}
            >
              Próxima cita
            </h2>
            <MisCitasCard
              appointment={nextAppointment}
              variant="featured"
              whatsappPhone={settings.whatsapp_phone}
              whatsappCancelMsg={settings.whatsapp_cancel_msg}
              whatsappRescheduleMsg={settings.whatsapp_reschedule_msg}
              businessName={settings.business_name}
              onRefresh={fetchAppointments}
              cancelHoursBefore={settings.cancel_hours_before ?? 3}
              rescheduleHoursBefore={settings.reschedule_hours_before ?? 3}
              barberMap={barberMap}
              barberCount={barberCount}
            />
          </section>
        )}

        {/* Historial */}
        {!loading && !fetchError && historial.length > 0 && (
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#7A7268' }}
            >
              Historial
            </h2>
            <div className="flex flex-col gap-3">
              {historial.map((appt) => (
                <MisCitasCard
                  key={appt.id}
                  appointment={appt}
                  variant="compact"
                  whatsappPhone={settings.whatsapp_phone}
                  whatsappCancelMsg={settings.whatsapp_cancel_msg}
                  whatsappRescheduleMsg={settings.whatsapp_reschedule_msg}
                  businessName={settings.business_name}
                  onRefresh={fetchAppointments}
                  cancelHoursBefore={settings.cancel_hours_before ?? 3}
                  rescheduleHoursBefore={settings.reschedule_hours_before ?? 3}
                  barberMap={barberMap}
                  barberCount={barberCount}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
