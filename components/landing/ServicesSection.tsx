'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { getServiceIcon } from './serviceIcons'

/* ─────────────────────────────────────────────────
   Service shape from /api/services/landing
───────────────────────────────────────────────── */
interface LandingService {
  id: string
  name: string
  description: string | null
  price_eur: number
  icon_key: string | null
}

/* Fallback — used if the API fails or returns empty, so the
   landing never renders blank. Mirrors the original 3 cards. */
const FALLBACK: LandingService[] = [
  { id: 'f1', name: 'Corte Clásico', description: 'El clásico de siempre. Lo que funciona, funciona.', price_eur: 7, icon_key: 'comb' },
  { id: 'f2', name: 'Corte', description: 'Adaptado a lo que llevas o a lo que quieres empezar a llevar.', price_eur: 9, icon_key: 'scissors' },
  { id: 'f3', name: 'Corte con Barba', description: 'El corte y el arreglo de barba. Todo en una visita.', price_eur: 10, icon_key: 'razor' },
]

export default function ServicesSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const viewport = { once: true, amount: 0.2 }

  const [services, setServices] = useState<LandingService[]>(FALLBACK)

  useEffect(() => {
    fetch('/api/services/landing')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.services) && d.services.length > 0) setServices(d.services)
      })
      .catch(() => {})
  }, [])

  return (
    <section
      id="servicios"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#0E0B08' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center"
        >
          <p className="text-meta mb-4" style={{ color: '#C9A96E' }}>
            Servicios
          </p>
          <h2
            className="text-section-title"
            style={{ color: '#F2EDE7' }}
          >
            Servicios claros.<br className="hidden md:block" /> Sin complicaciones.
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {services.map((service, i) => {
            const Icon = getServiceIcon(service.icon_key ?? undefined)
            return (
              <motion.div
                key={service.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.6, delay: i * 0.1, ease }}
                className="group relative flex flex-col items-center text-center gap-5 p-8 rounded-2xl transition-all duration-300 cursor-default"
                style={{
                  backgroundColor: '#161310',
                  border: '1px solid rgba(201,169,110,0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)'
                  e.currentTarget.style.backgroundColor = '#1C1915'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201,169,110,0.12)'
                  e.currentTarget.style.backgroundColor = '#161310'
                }}
              >
                {/* Icon circle */}
                <div
                  className="w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    color: '#C9A96E',
                  }}
                >
                  <Icon />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold tracking-wide" style={{ color: '#F2EDE7' }}>
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-body" style={{ color: '#7A7268' }}>
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="mt-auto pt-4 w-full" style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                  <p className="text-base uppercase tracking-widest mb-1" style={{ color: '#4A4540' }}>
                    Desde
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#C9A96E' }}>
                    {service.price_eur}
                    <span className="text-lg ml-0.5">€</span>
                  </p>
                </div>

                {/* Hover top glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.05) 0%, transparent 70%)',
                  }}
                />
              </motion.div>
            )
          })}
        </div>

        {/* CTA link */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.35, ease }}
          className="mt-10 text-center"
        >
          <a
            href="#reservar"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 text-base font-medium transition-colors"
            style={{ color: '#C9A96E' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Ver todos los servicios →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
