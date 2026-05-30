'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { GalleryImage } from '@/types'

const PLACEHOLDER_SEEDS = [
  'haircut-1', 'haircut-2', 'haircut-3', 'haircut-4',
  'haircut-5', 'haircut-6', 'haircut-7', 'haircut-8',
  'haircut-9', 'haircut-10', 'haircut-11', 'haircut-12',
]

const PLACEHOLDER_IMAGES: GalleryImage[] = PLACEHOLDER_SEEDS.map((seed, i) => ({
  id: seed,
  url: `https://picsum.photos/seed/${seed}/800/600`,
  alt_text: `Trabajo de barberia ${i + 1}`,
  display_order: i,
}))

// Asymmetric grid spans: gives a more editorial layout
const SPANS = [2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1]

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
          setImages(PLACEHOLDER_IMAGES)
        }
      })
      .catch(() => setImages(PLACEHOLDER_IMAGES))
      .finally(() => setLoading(false))
  }, [])

  const displayed = loading ? PLACEHOLDER_IMAGES : images

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
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            Nuestro trabajo
          </h2>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLACEHOLDER_IMAGES.map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl animate-pulse"
                style={{ backgroundColor: '#1A1A1A' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-auto">
            {displayed.map((img, i) => {
              const span = SPANS[i % SPANS.length]
              return (
                <motion.div
                  key={img.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.05, ease }}
                  className={`overflow-hidden rounded-xl ${
                    span === 2 ? 'md:col-span-2' : 'col-span-1'
                  }`}
                  style={{ border: '1px solid rgba(201,169,110,0.08)' }}
                >
                  <div className="aspect-[4/3] overflow-hidden group cursor-pointer">
                    <img
                      src={img.url}
                      alt={img.alt_text || `Trabajo ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
