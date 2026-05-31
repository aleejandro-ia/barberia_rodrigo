'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import GalleryCarousel from './GalleryCarousel'
import type { GalleryImage } from '@/types'

export default function GallerySection() {
  const shouldReduceMotion = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  const [images,  setImages]  = useState<GalleryImage[]>([])
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

  return (
    <section
      id="trabajos"
      className="py-24 md:py-36 overflow-hidden"
      style={{ backgroundColor: '#161310' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center"
        >
          <p
            className="text-meta mb-4"
            style={{ color: '#C9A96E' }}
          >
            Nuestros Trabajos
          </p>
          <h2
            className="text-section-title"
            style={{ color: '#F2EDE7' }}
          >
            Estilo que habla por ti.
          </h2>
        </motion.div>
      </div>

      {/* Carousel — full width on mobile, contained on desktop */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, delay: 0.15, ease }}
        className=""
      >
        <GalleryCarousel images={images} loading={loading} />
      </motion.div>

      {/* CTA */}
      <div className="px-6 max-w-6xl mx-auto">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="mt-10 text-center"
        >
          <a
            href="#reservar"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#reservar')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 text-base font-medium"
            style={{ color: '#C9A96E' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Reservar cita →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
