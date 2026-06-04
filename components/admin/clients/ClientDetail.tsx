'use client'

import { motion } from 'motion/react'
import {
  EnvelopeSimple,
  Phone,
  Scissors,
  CalendarBlank,
  Clock,
  User,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ClientRecord } from '@/types'
import { statusMeta } from './statusMeta'

interface ClientDetailProps {
  client: ClientRecord
  barberNames: Record<string, string>
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-3 px-2 rounded-xl"
      style={{ backgroundColor: '#1C1915', border: '1px solid rgba(201,169,110,0.1)' }}
    >
      <span style={{ color, fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{value}</span>
      <span style={{ color: '#7A7268', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>
        {label}
      </span>
    </div>
  )
}

export default function ClientDetail({ client, barberNames }: ClientDetailProps) {
  const initial = (client.name?.trim()?.[0] ?? '?').toUpperCase()
  const waPhone = client.phone.replace(/\D/g, '')

  return (
    <motion.div
      key={client.key}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div
        className="flex items-start gap-4 p-5 rounded-2xl"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.14)' }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgba(201,169,110,0.1)',
            border: '1px solid rgba(201,169,110,0.25)',
            color: '#C9A96E',
            fontSize: '1.5rem',
            fontWeight: 700,
            fontFamily: 'var(--font-serif), Georgia, serif',
          }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              style={{
                color: '#F2EDE7',
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              {client.name || 'Sin nombre'}
            </h2>
            {client.type === 'walkin' && (
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  fontSize: '0.62rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#C9A96E',
                  backgroundColor: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.25)',
                }}
              >
                Sin cuenta
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 mt-3">
            {client.email && (
              <div className="flex items-center gap-2" style={{ color: '#A89F94', fontSize: '0.88rem' }}>
                <EnvelopeSimple size={15} style={{ color: '#C9A96E', flexShrink: 0 }} />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2" style={{ color: '#A89F94', fontSize: '0.88rem' }}>
              <Phone size={15} style={{ color: '#C9A96E', flexShrink: 0 }} />
              <span>{client.phone || '—'}</span>
              {waPhone && (
                <a
                  href={`https://wa.me/34${waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: '#4ADE80', fontSize: '0.78rem' }}
                >
                  <WhatsappLogo size={15} weight="fill" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat value={client.completedCount} label="Asistidas" color="#4ADE80" />
        <Stat value={client.upcomingCount} label="Próximas" color="#C9A96E" />
        <Stat value={client.cancelledCount} label="Canceladas" color="#FF8080" />
        <Stat value={client.noShowCount} label="No asistió" color="#E6A85C" />
      </div>

      {/* Timeline */}
      <div>
        <p
          className="mb-3"
          style={{ color: '#7A7268', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}
        >
          Historial de citas · {client.totalCount}
        </p>

        <div className="flex flex-col gap-2.5">
          {client.appointments.map((a) => {
            const meta = statusMeta(a.status)
            const dateLabel = format(parseISO(a.slot_date), "EEE d 'de' MMM, yyyy", { locale: es })
            const barber = a.barber_id ? barberNames[a.barber_id] : null
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{
                  backgroundColor: '#161310',
                  border: '1px solid rgba(201,169,110,0.1)',
                  borderLeft: `2px solid ${meta.color}`,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5" style={{ color: '#F2EDE7', fontSize: '0.9rem', fontWeight: 500 }}>
                      <CalendarBlank size={14} style={{ color: '#C9A96E' }} />
                      <span className="capitalize">{dateLabel}</span>
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#A89F94', fontSize: '0.85rem' }}>
                      <Clock size={13} style={{ color: '#7A7268' }} />
                      {a.slot_start_time.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {a.notes && (
                      <span className="flex items-center gap-1" style={{ color: '#7A7268', fontSize: '0.8rem' }}>
                        <Scissors size={12} />
                        {a.notes}
                      </span>
                    )}
                    {barber && (
                      <span className="flex items-center gap-1" style={{ color: '#7A7268', fontSize: '0.8rem' }}>
                        <User size={12} />
                        {barber}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: meta.color,
                    backgroundColor: meta.bg,
                    border: `1px solid ${meta.border}`,
                  }}
                >
                  {meta.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
