'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { GalleryImage } from '@/types'

/* ──────────────────────────────────────────────
   Skeleton / placeholder cards
─────────────────────────────────────────────── */
function GalleryPlaceholder({ index }: { index: number }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{
        backgroundColor: '#0D0D0D',
        border: '1px dashed rgba(201,169,110,0.12)',
        borderRadius: 'inherit',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'rgba(201,169,110,0.2)' }}>
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="text-xs" style={{ color: 'rgba(201,169,110,0.2)' }}>
        Foto {index + 1}
      </span>
    </div>
  )
}

/* Asymmetric column spans for editorial grid feel */
const SPANS = [2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1]

/* Empty placeholder grid — shown when no images loaded */
const EMPTY_COUNT = 12

export default function GallerySection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.images) && data.images.length > 0) {
          setImages(data.images)
        } else {
          setImages([])
        }
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false))
  }, [])

  const hasImages = images.length > 0
  const itemCount = hasImages ? images.length : EMPTY_COUNT

  return (
    <section
      id="trabajos"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: '#111111' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] mb-4" style={{ color: '#C9A96E' }}>
            Galería
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            Estilo que habla por ti
          </h2>
        </motion.div>

        {/* Grid */}
        {loading ? (
          /* Loading skeleton */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: EMPTY_COUNT }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl animate-pulse"
                style={{ backgroundColor: '#1A1A1A' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-auto">
            {Array.from({ length: itemCount }).map((_, i) => {
              const span = SPANS[i % SPANS.length]
              const img = hasImages ? images[i] : null

              return (
                <motion.div
                  key={img?.id ?? `placeholder-${i}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.05, ease }}
                  className={`overflow-hidden rounded-xl ${span === 2 ? 'md:col-span-2' : 'col-span-1'}`}
                  style={{ border: '1px solid rgba(201,169,110,0.08)' }}
                >
                  <div className="aspect-[4/3] overflow-hidden group cursor-pointer">
                    {img ? (
                      <img
                        src={img.url}
                        alt={img.alt_text || `Trabajo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <GalleryPlaceholder index={i} />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Admin hint when empty */}
        {!loading && !hasImages && (
          <p className="mt-8 text-center text-xs" style={{ color: '#333' }}>
            Añade fotos desde el panel de administración → Galería
          </p>
        )}
      </div>
    </section>
  )
}
