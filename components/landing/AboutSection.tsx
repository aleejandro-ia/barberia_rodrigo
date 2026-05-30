'use client'

import { motion, useReducedMotion } from 'motion/react'

/* ──────────────────────────────────────────────
   Barber emblem — scissors in circular frame
─────────────────────────────────────────────── */
function BarberEmblem() {
  return (
    <svg
      width="76"
      height="76"
      viewBox="0 0 76 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle cx="38" cy="38" r="36" stroke="#C9A96E" strokeWidth="0.75" strokeOpacity="0.5" />
      {/* Inner circle */}
      <circle cx="38" cy="38" r="28" stroke="#C9A96E" strokeWidth="0.5" strokeOpacity="0.25" />

      {/* Scissors – top ring left */}
      <circle cx="23" cy="22" r="5.5" stroke="#C9A96E" strokeWidth="1.2" />
      {/* Scissors – top ring right */}
      <circle cx="53" cy="22" r="5.5" stroke="#C9A96E" strokeWidth="1.2" />

      {/* Blade left → bottom right */}
      <line x1="27.5" y1="26.5" x2="52" y2="54" stroke="#C9A96E" strokeWidth="1.6" strokeLinecap="round" />
      {/* Blade right → bottom left */}
      <line x1="48.5" y1="26.5" x2="24" y2="54" stroke="#C9A96E" strokeWidth="1.6" strokeLinecap="round" />

      {/* Handle ring left */}
      <circle cx="23" cy="55.5" r="4" stroke="#C9A96E" strokeWidth="1.2" />
      {/* Handle ring right */}
      <circle cx="53" cy="55.5" r="4" stroke="#C9A96E" strokeWidth="1.2" />

      {/* Pivot dot */}
      <circle cx="38" cy="40.5" r="2" fill="#C9A96E" fillOpacity="0.7" />

      {/* Cardinal decoration dots */}
      <circle cx="38" cy="3.5" r="1.5" fill="#C9A96E" fillOpacity="0.35" />
      <circle cx="38" cy="72.5" r="1.5" fill="#C9A96E" fillOpacity="0.35" />
      <circle cx="3.5" cy="38" r="1.5" fill="#C9A96E" fillOpacity="0.35" />
      <circle cx="72.5" cy="38" r="1.5" fill="#C9A96E" fillOpacity="0.35" />

      {/* Subtle diagonal marks at 45° */}
      <circle cx="13.5" cy="13.5" r="1" fill="#C9A96E" fillOpacity="0.2" />
      <circle cx="62.5" cy="13.5" r="1" fill="#C9A96E" fillOpacity="0.2" />
      <circle cx="13.5" cy="62.5" r="1" fill="#C9A96E" fillOpacity="0.2" />
      <circle cx="62.5" cy="62.5" r="1" fill="#C9A96E" fillOpacity="0.2" />
    </svg>
  )
}

/* ──────────────────────────────────────────────
   Portrait placeholder
─────────────────────────────────────────────── */
function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: '#0D0D0D', borderRadius: 'inherit' }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ color: 'rgba(201,169,110,0.3)' }}>
        <rect x="2" y="6" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="18" cy="16" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 29c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="text-xs uppercase tracking-widest" style={{ color: 'rgba(201,169,110,0.25)' }}>
        {label}
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Section values
─────────────────────────────────────────────── */
const VALUES = [
  {
    label: 'Precisión',
    desc: 'Cada corte, milímetro a milímetro',
  },
  {
    label: 'Pasión',
    desc: 'El oficio como forma de vida',
  },
  {
    label: 'Confianza',
    desc: 'Tu imagen, en buenas manos',
  },
]

export default function AboutSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const viewport = { once: true, amount: 0.2 }

  return (
    <section
      id="sobre-mi"
      className="relative py-24 md:py-36 px-6 overflow-hidden"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Subtle gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 0% 50%, rgba(201,169,110,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-16 md:gap-24 items-center">
        {/* Left: Portrait */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewport}
          transition={{ duration: 0.9, ease }}
          className="relative"
        >
          {/* Emblem — top-right decoration */}
          <div className="absolute -top-8 -right-6 z-10 opacity-70">
            <BarberEmblem />
          </div>

          <div
            className="overflow-hidden rounded-2xl"
            style={{
              aspectRatio: '4/5',
              border: '1px dashed rgba(201,169,110,0.2)',
            }}
          >
            <ImagePlaceholder label="Retrato Rodrigo" />
          </div>

          {/* Gold offset block */}
          <div
            className="absolute -bottom-5 -right-5 w-28 h-28 rounded-2xl -z-10"
            style={{
              backgroundColor: 'rgba(201,169,110,0.05)',
              border: '1px solid rgba(201,169,110,0.12)',
            }}
          />
        </motion.div>

        {/* Right: Text */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewport}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="flex flex-col justify-center"
        >
          <p
            className="text-xs font-medium uppercase tracking-[0.2em] mb-1"
            style={{ color: '#C9A96E' }}
          >
            Conoce a
          </p>

          <div className="w-8 h-px mb-6 mt-2" style={{ backgroundColor: '#C9A96E' }} />

          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight leading-tight"
            style={{ color: '#F5F5F5' }}
          >
            Rodrigo Fernández
          </h2>

          <p
            className="mt-2 text-sm font-medium uppercase tracking-[0.2em]"
            style={{ color: '#C9A96E' }}
          >
            Maestro Barbero
          </p>

          <p
            className="mt-8 text-base md:text-lg leading-relaxed"
            style={{ color: '#888888', maxWidth: '38ch' }}
          >
            Con más de 8 años perfeccionando el arte del corte, Rodrigo combina
            técnica clásica con estilo contemporáneo. Cada visita es una
            experiencia personal, no una transacción.
          </p>

          {/* Values */}
          <div className="mt-10 flex flex-col gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.label}
                initial={shouldReduceMotion ? false : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease }}
                className="flex items-start gap-4"
              >
                <div
                  className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'rgba(201,169,110,0.1)',
                    border: '1px solid rgba(201,169,110,0.3)',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#C9A96E' }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
                    {v.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#666' }}>
                    {v.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <a
            href="#reservar"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="mt-10 inline-flex w-fit items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
          >
            Reservar ahora
          </a>
        </motion.div>
      </div>
    </section>
  )
}
