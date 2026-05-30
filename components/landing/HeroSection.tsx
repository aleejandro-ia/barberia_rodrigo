'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const [heroImage, setHeroImage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setHeroImage(data.settings?.hero_image ?? null))
      .catch(() => {})
  }, [])

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden" aria-label="Hero">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {heroImage ? (
          <img src={heroImage} alt="" aria-hidden className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-end" style={{ backgroundColor: '#0E0B08' }}>
            <div className="w-1/2 h-full flex flex-col items-center justify-center gap-3 opacity-20"
              style={{ borderLeft: '1px dashed rgba(201,169,110,0.3)' }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ color: '#C9A96E' }}>
                <rect x="2" y="8" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
                <circle cx="22" cy="20" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 36c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#C9A96E' }}>Foto de fondo</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin → Imágenes</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(14,11,8,0.95) 0%, rgba(14,11,8,0.8) 50%, rgba(14,11,8,0.35) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to bottom, transparent, rgba(14,11,8,1))' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 80%, rgba(201,169,110,0.06) 0%, transparent 50%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-12 py-40">
        <div className="max-w-xl">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-8" style={{ backgroundColor: '#C9A96E' }} />
            <span className="text-sm font-medium uppercase tracking-[0.2em]" style={{ color: '#C9A96E' }}>BG Barber</span>
          </motion.div>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: 'clamp(3.5rem, 7vw, 6.5rem)', color: '#F2EDE7' }}
          >
            El corte{' '}<span style={{ color: '#F2EDE7' }}>que</span>
            <br />
            <span style={{ color: '#C9A96E', fontStyle: 'italic' }}>te define</span>
          </motion.h1>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease }}
            className="mt-6 flex flex-col gap-1"
          >
            <p className="text-lg font-medium" style={{ color: '#B0A898' }}>El carisma se entiende como la calidad de influir en las personas.</p>
            <p className="text-base" style={{ color: '#7A7268' }}>Solo cita previa.</p>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.36, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#reservar"
              onClick={(e) => { e.preventDefault(); document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
            >
              Reservar cita →
            </a>
            <a
              href="#trabajos"
              onClick={(e) => { e.preventDefault(); document.querySelector('#trabajos')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-medium border transition-all"
              style={{ color: '#F2EDE7', borderColor: 'rgba(201,169,110,0.25)', backgroundColor: 'rgba(201,169,110,0.04)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.25)')}
            >
              Ver trabajos <span style={{ color: '#C9A96E' }}>→</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
