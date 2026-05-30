'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { GalleryImage } from '@/types'

function GalleryPlaceholder({ index }: { index: number }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: '#1A1713', borderRadius: 'inherit' }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'rgba(201,169,110,0.25)' }}>
        <rect x="2" y="5" width="24" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="14" cy="12" r="4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 23c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      <span className="text-xs" style={{ color: 'rgba(201,169,110,0.2)' }}>
        {index + 1}
      </span>
    </div>
  )
}

const SPANS = [2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1]
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
      style={{ backgroundColor: '#161310' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] mb-4" style={{ color: '#C9A96E' }}>
            Nuestros Trabajos
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F2EDE7' }}
          >
            Estilo que habla por ti.
          </h2>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: EMPTY_COUNT }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl animate-pulse"
                style={{ backgroundColor: '#1A1713' }}
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
                  transition={{ duration: 0.5, delay: (i % 4) * 0.05, ease }}
                  className={`overflow-hidden rounded-xl ${span === 2 ? 'md:col-span-2' : 'col-span-1'}`}
                  style={{ border: '1px solid rgba(201,169,110,0.07)' }}
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

        {/* CTA */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
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
            Ver más trabajos →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
