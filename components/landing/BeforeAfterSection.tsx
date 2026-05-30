'use client'

import { motion, useReducedMotion } from 'motion/react'

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: '#0D0D0D', borderRadius: 'inherit' }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'rgba(201,169,110,0.3)' }}>
        <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="16" cy="14" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 26c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(201,169,110,0.35)' }}>
        {label}
      </span>
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.1)' }}>
        Añadir desde admin
      </span>
    </div>
  )
}

/* Placeholder pairs — Phase 2 will fetch from API */
const PAIRS = [
  { id: '1', label: 'Corte clásico' },
  { id: '2', label: 'Fade + barba' },
]

export default function BeforeAfterSection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const viewport = { once: true, amount: 0.15 }

  return (
    <section
      id="antes-despues"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#0A0A0A' }}
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
            Transformaciones
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            Antes &amp; Después
          </h2>
        </motion.div>

        {/* Pairs grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PAIRS.map((pair, i) => (
            <motion.div
              key={pair.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.7, delay: i * 0.12, ease }}
              className="flex flex-col gap-2"
            >
              {/* Label */}
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: '#555' }}>
                {pair.label}
              </p>

              {/* Before / After side by side */}
              <div className="grid grid-cols-2 gap-2">
                {/* Antes */}
                <div className="flex flex-col gap-1.5">
                  <div
                    className="relative overflow-hidden rounded-xl"
                    style={{
                      aspectRatio: '3/4',
                      border: '1px dashed rgba(201,169,110,0.15)',
                    }}
                  >
                    <ImagePlaceholder label="ANTES" />
                  </div>
                  <span
                    className="text-center text-xs font-semibold uppercase tracking-widest"
                    style={{ color: '#444' }}
                  >
                    Antes
                  </span>
                </div>

                {/* Después */}
                <div className="flex flex-col gap-1.5">
                  <div
                    className="relative overflow-hidden rounded-xl"
                    style={{
                      aspectRatio: '3/4',
                      border: '1px solid rgba(201,169,110,0.2)',
                    }}
                  >
                    <ImagePlaceholder label="DESPUÉS" />
                  </div>
                  <span
                    className="text-center text-xs font-semibold uppercase tracking-widest"
                    style={{ color: '#C9A96E' }}
                  >
                    Después
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Admin note */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="mt-8 text-center text-xs"
          style={{ color: '#333' }}
        >
          Gestiona las transformaciones desde el panel de administración
        </motion.p>
      </div>
    </section>
  )
}
