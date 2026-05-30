'use client'

import { motion, useReducedMotion } from 'motion/react'

/* ──────────────────────────────────────────────
   Service icons — custom SVGs, gold-toned
─────────────────────────────────────────────── */
function ScissorsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Top blade */}
      <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10.5" y1="10.5" x2="22" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Bottom blade */}
      <circle cx="21" cy="7" r="4" stroke="currentColor" strokeWidth="1.4" />
      <line x1="17.5" y1="10.5" x2="6" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Handle rings */}
      <circle cx="6" cy="23" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="22" cy="23" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      {/* Pivot dot */}
      <circle cx="14" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}

function CombIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="9" width="22" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      {/* Teeth */}
      <line x1="6" y1="14" x2="6" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9.5" y1="14" x2="9.5" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="14" x2="13" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16.5" y1="14" x2="16.5" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="20" y1="14" x2="20" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Top handle line */}
      <line x1="5" y1="9" x2="23" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function RazorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Handle */}
      <rect x="12" y="3" width="4" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
      {/* Blade body */}
      <path d="M5 14h18a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" />
      {/* Blade edge */}
      <line x1="4" y1="20" x2="24" y2="20" stroke="currentColor" strokeWidth="1.4" />
      {/* Cutting edge highlight */}
      <line x1="4" y1="22" x2="24" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Center line detail */}
      <line x1="10" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
    </svg>
  )
}

/* ──────────────────────────────────────────────
   Service data
─────────────────────────────────────────────── */
const SERVICES = [
  {
    Icon: ScissorsIcon,
    name: 'Corte Clásico',
    price: '7',
    description:
      'El corte de siempre, ejecutado con técnica impecable. Resultado atemporal y cuidado.',
  },
  {
    Icon: CombIcon,
    name: 'Corte',
    price: '9',
    description:
      'Corte moderno adaptado a tu estilo. Fade, textura o capas según lo que necesites.',
  },
  {
    Icon: RazorIcon,
    name: 'Corte con Barba',
    price: '10',
    description:
      'Corte completo más arreglo y perfilado de barba. El combo perfecto para el cuidado total.',
  },
]

export default function ServicesSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const viewport = { once: true, amount: 0.2 }

  return (
    <section
      id="servicios"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#111111' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease }}
          className="mb-14"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] mb-4" style={{ color: '#C9A96E' }}>
            Servicios
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            Hecho para hombres<br className="hidden md:block" /> que valoran su estilo
          </h2>
        </motion.div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.name}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="group relative flex flex-col gap-6 p-7 rounded-2xl transition-all duration-300"
              style={{
                backgroundColor: '#0D0D0D',
                border: '1px solid rgba(201,169,110,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'
                e.currentTarget.style.backgroundColor = '#111111'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201,169,110,0.1)'
                e.currentTarget.style.backgroundColor = '#0D0D0D'
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors duration-300"
                style={{
                  backgroundColor: 'rgba(201,169,110,0.08)',
                  border: '1px solid rgba(201,169,110,0.15)',
                  color: '#C9A96E',
                }}
              >
                <service.Icon />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2 flex-1">
                <h3 className="text-lg font-semibold" style={{ color: '#F5F5F5' }}>
                  {service.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>
                  {service.description}
                </p>
              </div>

              {/* Price */}
              <div
                className="flex items-end justify-between pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#555' }}>
                  Desde
                </span>
                <span className="text-3xl font-bold tracking-tight" style={{ color: '#C9A96E' }}>
                  {service.price}
                  <span className="text-base font-medium ml-1">€</span>
                </span>
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.04) 0%, transparent 70%)',
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mt-10 text-center"
        >
          <a
            href="#reservar"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
          >
            Reservar ahora
          </a>
        </motion.div>
      </div>
    </section>
  )
}
