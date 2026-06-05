'use client'

import { WhatsappLogo, Phone, Scissors, Clock, ArrowRight, MoonStars, CheckCircle } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { whatsAppReminder, cleanPhone } from '@/lib/whatsapp'
import type { DayClassification } from '@/lib/today'

interface NowNextCardProps {
  classification: DayClassification
  date: string
  /** Total confirmed appointments today (to detect "day done" vs "no bookings"). */
  totalConfirmed: number
}

function timeLabel(t: string) { return t.slice(0, 5) }

function waUrl(name: string, phone: string, date: string, start: string) {
  const dateFormatted = format(parseISO(date), "d 'de' MMMM", { locale: es })
  return whatsAppReminder(phone, name, dateFormatted, timeLabel(start))
}

function minutesText(m: number): string {
  if (m <= 0) return 'ahora'
  if (m < 60) return `en ${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `en ${h} h` : `en ${h} h ${rem} min`
}

export default function NowNextCard({ classification, date, totalConfirmed }: NowNextCardProps) {
  const { current, next } = classification

  // Empty states
  if (!current && !next) {
    const done = totalConfirmed > 0
    return (
      <div
        className="flex items-center gap-3 px-5 py-5 rounded-3xl"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl flex-shrink-0" style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}>
          {done ? <CheckCircle size={22} weight="duotone" style={{ color: '#4ADE80' }} /> : <MoonStars size={22} weight="duotone" style={{ color: '#C9A96E' }} />}
        </div>
        <div>
          <p className="font-semibold" style={{ color: '#F2EDE7', fontSize: '1rem' }}>
            {done ? 'Día completado' : 'Sin citas para hoy'}
          </p>
          <p className="mt-0.5" style={{ color: '#7A7268', fontSize: '0.85rem' }}>
            {done ? 'No quedan citas pendientes.' : 'Aún no hay reservas confirmadas.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── AHORA MISMO ── */}
      {current && (
        <div
          className="relative px-5 py-5 rounded-3xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(201,169,110,0.07)',
            border: '1px solid rgba(201,169,110,0.35)',
            boxShadow: '0 0 0 1px rgba(201,169,110,0.08), 0 8px 30px -12px rgba(201,169,110,0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: '#C9A96E' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#C9A96E' }} />
            </span>
            <span className="uppercase tracking-[0.16em] font-semibold" style={{ color: '#C9A96E', fontSize: '0.68rem' }}>
              Ahora mismo
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: '#F2EDE7', fontSize: '1.35rem' }}>{current.appt.client_name}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1.5" style={{ color: '#C9B79A', fontSize: '0.85rem' }}>
                  <Scissors size={14} /> {current.appt.notes?.trim() || 'Sin especificar'}
                </span>
                <span className="flex items-center gap-1.5" style={{ color: '#C9B79A', fontSize: '0.85rem' }}>
                  <Clock size={14} /> {timeLabel(current.slot.start_time)}–{timeLabel(current.slot.end_time)}
                </span>
              </div>
              <p className="mt-2 font-medium" style={{ color: '#C9A96E', fontSize: '0.85rem' }}>
                {current.minutesLeft > 0 ? `Quedan ${current.minutesLeft} min` : 'Terminando'}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <a
                href={waUrl(current.appt.client_name, current.appt.client_phone, date, current.slot.start_time)}
                target="_blank" rel="noopener noreferrer" title="WhatsApp"
                className="flex items-center justify-center w-11 h-11 rounded-2xl"
                style={{ color: '#4ADE80', backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}
              >
                <WhatsappLogo size={20} />
              </a>
              <a
                href={`tel:+${cleanPhone(current.appt.client_phone)}`}
                title="Llamar"
                className="flex items-center justify-center w-11 h-11 rounded-2xl"
                style={{ color: '#C9A96E', backgroundColor: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)' }}
              >
                <Phone size={19} weight="fill" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── SIGUIENTE ── */}
      {next && (
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 rounded-3xl"
          style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRight size={13} style={{ color: '#7A7268' }} />
              <span className="uppercase tracking-[0.14em] font-semibold" style={{ color: '#7A7268', fontSize: '0.62rem' }}>
                Siguiente · {minutesText(next.minutesUntil)}
              </span>
            </div>
            <p className="font-semibold truncate" style={{ color: '#F2EDE7', fontSize: '1.1rem' }}>{next.appt.client_name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span style={{ color: '#7A7268', fontSize: '0.82rem' }}>{timeLabel(next.slot.start_time)}</span>
              <span className="flex items-center gap-1.5" style={{ color: '#7A7268', fontSize: '0.82rem' }}>
                <Scissors size={13} /> {next.appt.notes?.trim() || 'Sin especificar'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <a
              href={waUrl(next.appt.client_name, next.appt.client_phone, date, next.slot.start_time)}
              target="_blank" rel="noopener noreferrer" title="WhatsApp"
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ color: '#4ADE80', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.22)' }}
            >
              <WhatsappLogo size={18} />
            </a>
            <a
              href={`tel:+${cleanPhone(next.appt.client_phone)}`}
              title="Llamar"
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ color: '#C9A96E', backgroundColor: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.22)' }}
            >
              <Phone size={17} weight="fill" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
