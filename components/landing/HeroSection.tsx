'use client'

import { motion, useReducedMotion } from 'motion/react'

/* ─────────────────────────────────────────────────
   Full-bg hero — photo fills viewport, text overlay
   Image = placeholder until set from admin panel
───────────────────────────────────────────────── */
export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <section
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* ── Background: placeholder (replace with real photo from admin) ── */}
      <div className="absolute inset-0 z-0">
        {/* Photo placeholder */}
        <div
          className="w-full h-full flex items-center justify-end"
          style={{ backgroundColor: '#0E0B08' }}
        >
          {/* Right-side photo area indicator */}
          <div
            className="w-1/2 h-full flex flex-col items-center justify-center gap-3 opacity-30"
            style={{
              borderLeft: '1px dashed rgba(201,169,110,0.2)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: 'rgba(201,169,110,0.5)' }}>
              <rect x="3" y="9" width="42" height="30" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx="24" cy="22" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 38c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,169,110,0.5)' }}>
              Foto de fondo
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Admin → Hero imagen
            </span>
          </div>
        </div>

        {/* Dark gradient overlay — left side darker so text is readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(14,11,8,0.95) 0%, rgba(14,11,8,0.8) 50%, rgba(14,11,8,0.4) 100%)',
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(14,11,8,1))',
          }}
        />
        {/* Subtle gold glow bottom-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 80%, rgba(201,169,110,0.06) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-12 py-40">
        <div className="max-w-xl">
          {/* Eyebrow */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-8" style={{ backgroundColor: '#C9A96E' }} />
            <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: '#C9A96E' }}>
              Barbería Rodrigo
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: '#F2EDE7' }}
          >
            El corte{' '}
            <span style={{ color: '#F2EDE7' }}>que</span>
            <br />
            <span style={{ color: '#C9A96E', fontStyle: 'italic' }}>te define</span>
          </motion.h1>

          {/* Subtitles */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease }}
            className="mt-6 flex flex-col gap-1"
          >
            <p className="text-base font-medium" style={{ color: '#B0A898' }}>
              Estilo, precisión y confianza.
            </p>
            <p className="text-sm" style={{ color: '#7A7268' }}>
              No es solo un corte, es tu mejor versión.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.36, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#reservar"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
            >
              Reservar cita
              <span>→</span>
            </a>
            <a
              href="#trabajos"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#trabajos')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium border transition-all duration-200 hover:border-[rgba(201,169,110,0.6)]"
              style={{
                color: '#F2EDE7',
                borderColor: 'rgba(201,169,110,0.3)',
                backgroundColor: 'rgba(201,169,110,0.04)',
              }}
            >
              Ver trabajos
              <span style={{ color: '#C9A96E' }}>→</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
