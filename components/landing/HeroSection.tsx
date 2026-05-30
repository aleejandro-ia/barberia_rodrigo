'use client'

import { motion, useReducedMotion } from 'motion/react'

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: '#0D0D0D', borderRadius: 'inherit' }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: 'rgba(201,169,110,0.3)' }}>
        <rect x="3" y="9" width="42" height="30" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="24" cy="22" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 38c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,169,110,0.3)' }}>
        {label}
      </span>
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.12)' }}>
        Panel admin → subir foto
      </span>
    </div>
  )
}

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <section
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
      aria-label="Hero"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 60%, rgba(201,169,110,0.05) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-32 lg:py-0">
        {/* Left: Text */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-8" style={{ backgroundColor: '#C9A96E' }} />
            <span
              className="text-xs font-medium uppercase tracking-[0.2em]"
              style={{ color: '#C9A96E' }}
            >
              Barbería Rodrigo
            </span>
          </motion.div>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="font-bold text-white tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5.2rem)', lineHeight: 1.05 }}
          >
            El corte que<br />te define
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease }}
            className="mt-7 text-lg leading-relaxed max-w-sm"
            style={{ color: '#888888' }}
          >
            Reserva tu cita con Rodrigo. Especialista en fades y cortes clásicos
            con más de 8 años de experiencia.
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <a
              href="#reservar"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-8 py-4 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
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
              className="px-8 py-4 rounded-full text-sm font-medium border transition-all duration-200"
              style={{ color: '#F5F5F5', borderColor: 'rgba(201,169,110,0.25)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.25)')}
            >
              Ver trabajos
            </a>
          </motion.div>
        </div>

        {/* Right: Hero image placeholder */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease }}
          className="relative hidden lg:block"
        >
          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              aspectRatio: '3/4',
              border: '1px dashed rgba(201,169,110,0.2)',
            }}
          >
            <ImagePlaceholder label="Foto principal" />
          </div>

          {/* Decorative offsets */}
          <div
            className="absolute -bottom-6 -right-6 w-40 h-40 rounded-3xl -z-10"
            style={{
              backgroundColor: 'rgba(201,169,110,0.03)',
              border: '1px solid rgba(201,169,110,0.08)',
            }}
          />
          <div
            className="absolute -top-4 -left-4 w-20 h-20 rounded-2xl -z-10"
            style={{ border: '1px solid rgba(201,169,110,0.06)' }}
          />
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(10,10,10,0.8))',
        }}
      />
    </section>
  )
}
