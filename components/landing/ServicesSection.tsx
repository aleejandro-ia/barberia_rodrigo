'use client'

import { motion, useReducedMotion } from 'motion/react'

/* ─────────────────────────────────────────────────
   Illustrated service icons — premium barbershop style
───────────────────────────────────────────────── */
function CorteClasico() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Comb body */}
      <rect x="4" y="13" width="32" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {/* Comb teeth */}
      {[7, 11, 15, 19, 23, 27, 31].map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      {/* Handle decorative line */}
      <line x1="5" y1="13" x2="35" y2="13" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      {/* Small sparkle */}
      <circle cx="34" cy="7" r="1.5" fill="currentColor" fillOpacity="0.6" />
      <line x1="34" y1="3.5" x2="34" y2="5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="30.5" y1="7" x2="32" y2="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
    </svg>
  )
}

function CorteModerno() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Scissors top blade ring */}
      <circle cx="10" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      {/* Scissors bottom blade ring */}
      <circle cx="30" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      {/* Blades crossing */}
      <line x1="14.5" y1="15.5" x2="35" y2="33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="25.5" y1="15.5" x2="5" y2="33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Handle bottom rings */}
      <circle cx="10" cy="33.5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="30" cy="33.5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      {/* Pivot */}
      <circle cx="20" cy="24.5" r="2" fill="currentColor" fillOpacity="0.7" />
    </svg>
  )
}

function CorteBarba() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Razor handle */}
      <rect x="16" y="4" width="8" height="13" rx="4" stroke="currentColor" strokeWidth="1.4" />
      {/* Handle grip lines */}
      <line x1="17.5" y1="9" x2="22.5" y2="9" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.5" />
      <line x1="17.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.5" />
      {/* Razor head */}
      <rect x="5" y="18" width="30" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      {/* Cutting edge */}
      <line x1="5" y1="24.5" x2="35" y2="24.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Blade sharpness line */}
      <line x1="5" y1="26.5" x2="35" y2="26.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Blade detail */}
      <line x1="13" y1="21" x2="27" y2="21" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      {/* Small comb below */}
      <rect x="9" y="29" width="22" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      {[12, 16, 20, 24, 28].map((x) => (
        <line key={x} x1={x} y1="33" x2={x} y2="36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────────────────
   Service data
───────────────────────────────────────────────── */
const SERVICES = [
  {
    Icon: CorteClasico,
    name: 'Corte Clásico',
    description: 'El corte de siempre, ejecutado con técnica impecable y resultado atemporal.',
    price: '7',
  },
  {
    Icon: CorteModerno,
    name: 'Corte',
    description: 'Corte moderno adaptado a tu estilo. Fade, textura o capas según necesites.',
    price: '9',
  },
  {
    Icon: CorteBarba,
    name: 'Corte con Barba',
    description: 'Corte completo más arreglo y perfilado de barba. El combo perfecto.',
    price: '10',
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
          <p className="text-xs font-medium uppercase tracking-[0.25em] mb-4" style={{ color: '#C9A96E' }}>
            Servicios Premium
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F2EDE7' }}
          >
            Hechos para hombres<br className="hidden md:block" /> que valoran su estilo.
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.name}
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
                <service.Icon />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold tracking-wide" style={{ color: '#F2EDE7' }}>
                  {service.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7A7268' }}>
                  {service.description}
                </p>
              </div>

              {/* Price */}
              <div className="mt-auto pt-4 w-full" style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#4A4540' }}>
                  Desde
                </p>
                <p className="text-3xl font-bold" style={{ color: '#C9A96E' }}>
                  {service.price}
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
          ))}
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
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
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
