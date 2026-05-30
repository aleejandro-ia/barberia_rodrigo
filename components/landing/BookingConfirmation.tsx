'use client'

import { motion } from 'motion/react'
import { CheckCircle } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface BookingConfirmationProps {
  date: string
  startTime: string
  onBookAnother: () => void
}

export default function BookingConfirmation({
  date,
  startTime,
  onBookAnother,
}: BookingConfirmationProps) {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '34000000000'
  const dateLabel = format(parseISO(date), "EEEE d 'de' MMMM yyyy", { locale: es })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center py-6 gap-6"
    >
      {/* Gold checkmark */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)' }}
      >
        <CheckCircle size={32} weight="fill" style={{ color: '#C9A96E' }} />
      </div>

      <div>
        <h3
          className="text-xl font-bold tracking-tight"
          style={{ color: '#F5F5F5' }}
        >
          Tu cita esta confirmada
        </h3>
        <p className="mt-2 text-sm capitalize" style={{ color: '#888888' }}>
          {dateLabel}
        </p>
        <p className="text-lg font-semibold mt-1" style={{ color: '#C9A96E' }}>
          {startTime.slice(0, 5)}
        </p>
        <p className="text-sm mt-1" style={{ color: '#888888' }}>
          con Rodrigo Fernandez
        </p>
      </div>

      <div
        className="w-full px-4 py-4 rounded-xl text-sm leading-relaxed"
        style={{
          backgroundColor: 'rgba(201,169,110,0.05)',
          border: '1px solid rgba(201,169,110,0.15)',
          color: '#888888',
        }}
      >
        Te esperamos. Si necesitas cambiar o cancelar, contacta por WhatsApp.
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 rounded-full text-sm font-medium text-center transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#25D366', color: '#fff' }}
        >
          Contactar por WhatsApp
        </a>
        <button
          onClick={onBookAnother}
          className="flex-1 py-3 rounded-full text-sm font-medium transition-colors"
          style={{
            border: '1px solid rgba(201,169,110,0.2)',
            color: '#888888',
          }}
        >
          Volver al inicio
        </button>
      </div>
    </motion.div>
  )
}
