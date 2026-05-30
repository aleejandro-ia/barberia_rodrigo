'use client'

import { motion, useReducedMotion } from 'motion/react'

function ImagePlaceholder({ label }: { label: string }) {
  const isAfter = label === 'Después'
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: '#1A1713', borderRadius: 'inherit' }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
        style={{ color: isAfter ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.15)' }}>
        <circle cx="14" cy="9" r="5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 27c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      <span
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: isAfter ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.2)' }}
      >
        {label}
      </span>
    </div>
  )
}

const PAIRS = [
  { id: '1', label: 'Fade clásico' },
  { id: '2', label: 'Degradado + barba' },
  { id: '3', label: 'Corte texturizado' },
]

export default function BeforeAfterSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const viewport = { once: true, amount: 0.15 }

  return (
    <section
      id="antes-despues"
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
            Transformaciones
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F2EDE7' }}
          >
            Antes &amp; Después
          </h2>
        </motion.div>

        {/* 3 pairs grid — matches reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAIRS.map((pair, i) => (
            <motion.div
              key={pair.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="flex flex-col gap-2"
            >
              {/* Pair label */}
              <p className="text-xs uppercase tracking-widest" style={{ color: '#4A4540' }}>
                {pair.label}
              </p>

              {/* Before / After side by side */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col gap-1">
                  <div
                    className="overflow-hidden rounded-xl"
                    style={{
                      aspectRatio: '3/4',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <ImagePlaceholder label="Antes" />
                  </div>
                  <span className="text-center text-xs uppercase tracking-widest font-medium" style={{ color: '#4A4540' }}>
                    Antes
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div
                    className="overflow-hidden rounded-xl"
                    style={{
                      aspectRatio: '3/4',
                      border: '1px solid rgba(201,169,110,0.18)',
                    }}
                  >
                    <ImagePlaceholder label="Después" />
                  </div>
                  <span className="text-center text-xs uppercase tracking-widest font-medium" style={{ color: '#C9A96E' }}>
                    Después
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="mt-10 text-center"
        >
          <a
            href="#reservar"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: '#C9A96E' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Más transformaciones →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
