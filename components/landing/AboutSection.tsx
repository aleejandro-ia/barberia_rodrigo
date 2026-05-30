'use client'

import { motion, useReducedMotion } from 'motion/react'

export default function AboutSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const viewportOpts = { once: true, amount: 0.2 }

  return (
    <section
      id="sobre-mi"
      className="relative py-24 md:py-36 px-6 overflow-hidden"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 0% 50%, rgba(201,169,110,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-20 items-center">
        {/* Left: Portrait photo */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportOpts}
          transition={{ duration: 0.9, ease }}
          className="relative"
        >
          <div
            className="overflow-hidden rounded-2xl"
            style={{ border: '1px solid rgba(201,169,110,0.12)' }}
          >
            <img
              src="https://picsum.photos/seed/barber-rodrigo/800/1000"
              alt="Rodrigo Fernandez, maestro barbero"
              className="w-full h-full object-cover"
              style={{ aspectRatio: '4/5' }}
              loading="lazy"
            />
          </div>
          {/* Gold accent corner detail */}
          <div
            className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl -z-10"
            style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.15)' }}
          />
        </motion.div>

        {/* Right: Text content */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportOpts}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="flex flex-col justify-center"
        >
          {/* Gold accent line */}
          <div
            className="w-10 h-px mb-8"
            style={{ backgroundColor: '#C9A96E' }}
          />

          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight leading-tight"
            style={{ color: '#F5F5F5' }}
          >
            Rodrigo Fernandez
          </h2>

          <p
            className="mt-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: '#C9A96E' }}
          >
            Maestro barbero
          </p>

          <p
            className="mt-8 text-base md:text-lg leading-relaxed max-w-lg"
            style={{ color: '#888888' }}
          >
            Con mas de 8 anos perfeccionando el arte del corte, Rodrigo combina tecnica clasica con
            estilo contemporaneo. Cada visita es una experiencia personal.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-6">
            {[
              { value: '8+', label: 'Anos de experiencia' },
              { value: '100%', label: 'Dedicacion personal' },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: '#C9A96E' }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-sm" style={{ color: '#888888' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <a
            href="#reservar"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="mt-10 inline-flex w-fit items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
          >
            Reservar ahora
          </a>
        </motion.div>
      </div>
    </section>
  )
}
