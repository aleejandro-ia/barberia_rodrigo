'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Scissors, Heart, Handshake } from '@phosphor-icons/react'

/* ─────────────────────────────────────────────────
   Ornate circular portrait frame (72 ticks + cardinal diamonds)
───────────────────────────────────────────────── */
const TICK_COUNT = 72
const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
  const angleDeg = i * 5
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  const cx = 160, cy = 160
  const isLarge = angleDeg % 30 === 0
  const rOuter = 154, rInner = isLarge ? 142 : 150
  return {
    x1: cx + rOuter * Math.cos(angleRad), y1: cy + rOuter * Math.sin(angleRad),
    x2: cx + rInner * Math.cos(angleRad), y2: cy + rInner * Math.sin(angleRad),
    isLarge,
  }
})

function OrnateCircleFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ width: 320, height: 320 }}>
      <svg width="320" height="320" viewBox="0 0 320 320" className="absolute inset-0 z-10 pointer-events-none" aria-hidden>
        <circle cx="160" cy="160" r="157" fill="none" stroke="#C9A96E" strokeWidth="0.75" strokeOpacity="0.4" />
        {TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#C9A96E" strokeWidth={t.isLarge ? 1.5 : 0.75}
            strokeOpacity={t.isLarge ? 0.7 : 0.35} strokeLinecap="round" />
        ))}
        <circle cx="160" cy="160" r="138" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.75" />
        <circle cx="160" cy="160" r="133" fill="none" stroke="#C9A96E" strokeWidth="0.5" strokeOpacity="0.3" />
        {/* Cardinal diamonds */}
        <polygon points="160,2 163.5,9 160,16 156.5,9" fill="#C9A96E" fillOpacity="0.8" />
        <polygon points="160,304 163.5,311 160,318 156.5,311" fill="#C9A96E" fillOpacity="0.8" />
        <polygon points="304,160 311,163.5 318,160 311,156.5" fill="#C9A96E" fillOpacity="0.8" />
        <polygon points="2,160 9,163.5 16,160 9,156.5" fill="#C9A96E" fillOpacity="0.8" />
        <circle cx="47" cy="47" r="2.5" fill="#C9A96E" fillOpacity="0.3" />
        <circle cx="273" cy="47" r="2.5" fill="#C9A96E" fillOpacity="0.3" />
        <circle cx="47" cy="273" r="2.5" fill="#C9A96E" fillOpacity="0.3" />
        <circle cx="273" cy="273" r="2.5" fill="#C9A96E" fillOpacity="0.3" />
        <circle cx="160" cy="160" r="126" fill="none" stroke="#C9A96E" strokeWidth="2" strokeOpacity="0.9" />
      </svg>
      <div className="absolute overflow-hidden rounded-full" style={{ width: 252, height: 252, top: 34, left: 34, zIndex: 1, backgroundColor: '#161310' }}>
        {children}
      </div>
    </div>
  )
}

function PortraitContent({ url }: { url: string | null }) {
  if (url) {
    return <img src={url} alt="Rodrigo Fernández" className="w-full h-full object-cover" />
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: 'rgba(201,169,110,0.3)' }}>
        <circle cx="24" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 46c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="text-xs uppercase tracking-widest text-center px-4" style={{ color: 'rgba(201,169,110,0.3)' }}>Foto Rodrigo</span>
    </div>
  )
}

const VALUES = [
  { icon: Scissors, label: 'Precisión', desc: 'Cada corte, milímetro a milímetro' },
  { icon: Heart,    label: 'Pasión',    desc: 'El oficio como forma de vida' },
  { icon: Handshake, label: 'Confianza', desc: 'Tu imagen, en buenas manos' },
]

export default function AboutSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const viewport = { once: true, amount: 0.2 }
  const [portrait, setPortrait] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setPortrait(data.settings?.about_portrait ?? null))
      .catch(() => {})
  }, [])

  return (
    <section id="sobre-mi" className="relative py-24 md:py-36 px-6 overflow-hidden" style={{ backgroundColor: '#161310' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(201,169,110,0.04) 0%, transparent 65%)' }} />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-12 md:gap-20 items-center">
        {/* Left: Ornate circular portrait */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewport}
          transition={{ duration: 1, ease }}
          className="flex justify-center"
        >
          <OrnateCircleFrame>
            <PortraitContent url={portrait} />
          </OrnateCircleFrame>
        </motion.div>

        {/* Right: Text */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewport}
          transition={{ duration: 1, delay: 0.1, ease }}
          className="flex flex-col"
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] mb-2" style={{ color: '#C9A96E' }}>Conoce a</p>
          <h2 className="font-bold tracking-tight leading-tight" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: '#F2EDE7' }}>
            Rodrigo Fernández
          </h2>
          <p className="mt-1" style={{ fontFamily: 'var(--font-dancing)', fontSize: '1.5rem', color: '#C9A96E', lineHeight: 1.4 }}>
            Maestro Barbero
          </p>
          <p className="mt-7 text-base leading-relaxed" style={{ color: '#7A7268', maxWidth: '42ch' }}>
            Más que un barbero, es un maestro de estilo. Cada corte es el resultado de años de dedicación, precisión y pasión por el oficio. Mi misión es que cada cliente salga sintiéndose su mejor versión.
          </p>
          <p className="mt-5" style={{ fontFamily: 'var(--font-dancing)', fontSize: '1.75rem', color: '#C9A96E', letterSpacing: '0.02em' }}>
            R. Fernández
          </p>

          <div className="flex items-center gap-6 mt-8 flex-wrap">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.label}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08, ease }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}>
                  <v.icon size={14} weight="duotone" style={{ color: '#C9A96E' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#B0A898' }}>{v.label}</span>
              </motion.div>
            ))}
          </div>

          <a
            href="#reservar"
            onClick={(e) => { e.preventDefault(); document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="mt-9 inline-flex w-fit items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
          >
            Reservar ahora →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
