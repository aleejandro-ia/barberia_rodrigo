'use client'

import { motion, useReducedMotion } from 'motion/react'

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <section
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://picsum.photos/seed/barbershop-dark/1920/1080"
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,10,10,0.72)' }} />
        {/* Gold radial glow at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(201,169,110,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* Headline */}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="font-sans font-bold tracking-tight text-white leading-[1.05]"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 6rem)',
          }}
        >
          El corte que te define
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="mt-6 text-base sm:text-lg max-w-md leading-relaxed"
          style={{ color: '#888888' }}
        >
          Reserva tu cita con Rodrigo. Especialista en fades y cortes clasicos.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28, ease }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="#reservar"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-8 py-4 rounded-full text-base font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
          >
            Reservar cita
          </a>
          <a
            href="#trabajos"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#trabajos')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-8 py-4 rounded-full text-base font-medium border transition-colors duration-200"
            style={{
              color: '#F5F5F5',
              borderColor: 'rgba(201,169,110,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'
            }}
          >
            Ver trabajos
          </a>
        </motion.div>
      </div>
    </section>
  )
}
