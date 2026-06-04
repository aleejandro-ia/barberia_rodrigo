'use client'

import { useRef, useEffect } from 'react'
import { useReducedMotion } from 'motion/react'
import type { GalleryImage } from '@/types'

/* ─── Constants ──────────────────────────────────────────── */
const CARD_W      = 280    // px
const CARD_H      = 400    // px
const GAP         = 24     // px between cards
const SLOT_W      = CARD_W + GAP
const AUTO_SPEED  = 0.45   // px per frame (~27px/sec at 60fps) — slow & elegant
const FRICTION    = 0.92   // inertia decay after drag release
const DRAG_SENS   = 1.0    // px moved per px dragged

/* ─── Placeholder ─────────────────────────────────────────── */
function Placeholder({ index }: { index: number }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: '#1C1915' }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden
        style={{ color: 'rgba(201,169,110,0.2)' }}>
        <rect x="3" y="7" width="34" height="26" rx="3.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="20" cy="18" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 33c0-6.627 5.373-12 12-12s12 5.373 12 12"
          stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span
        className="text-sm font-medium uppercase tracking-widest"
        style={{ color: 'rgba(201,169,110,0.2)' }}
      >
        {index + 1}
      </span>
    </div>
  )
}

/* ─── Skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div
      className="w-full h-full animate-pulse"
      style={{ backgroundColor: '#1A1713' }}
    />
  )
}

/* ─── Main carousel ───────────────────────────────────────── */
interface GalleryCarouselProps {
  images:  GalleryImage[]
  loading: boolean
}

export default function GalleryCarousel({ images, loading }: GalleryCarouselProps) {
  const reduce = useReducedMotion()

  const slots: (GalleryImage | null)[] = loading
    ? Array(6).fill(null)
    : images.length > 0 ? images : Array(6).fill(null)

  // Triple the array so there's always content visible on both sides
  const tiles = [...slots, ...slots, ...slots]
  const totalW = slots.length * SLOT_W  // width of ONE copy — used for seamless reset

  const trackRef    = useRef<HTMLDivElement>(null)
  const posRef      = useRef(0)          // current X offset in px (negative = moved left)
  const velRef      = useRef(0)          // px/frame inertia
  const dragging    = useRef(false)
  const lastX       = useRef(0)
  const rafId       = useRef<number | null>(null)

  /* ─── RAF loop ─────────────────────────────────────────── */
  useEffect(() => {
    if (reduce) return

    const tick = () => {
      if (!trackRef.current) return

      if (!dragging.current) {
        if (Math.abs(velRef.current) > 0.1) {
          velRef.current *= FRICTION
          posRef.current -= velRef.current   // inertia still moves left
        } else {
          velRef.current = 0
          posRef.current -= AUTO_SPEED        // constant slow drift left
        }
      }

      // Seamless reset: when we've scrolled past one full copy, snap back
      if (posRef.current <= -totalW) {
        posRef.current += totalW
      }
      // Also handle right-drag past start
      if (posRef.current > 0) {
        posRef.current -= totalW
      }

      trackRef.current.style.transform = `translateX(${posRef.current}px)`
      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [reduce, totalW])

  /* ─── Pointer drag ─────────────────────────────────────── */
  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const onDown = (e: PointerEvent) => {
      dragging.current = true
      lastX.current    = e.clientX
      velRef.current   = 0
      el.setPointerCapture(e.pointerId)
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastX.current
      posRef.current  += dx * DRAG_SENS
      velRef.current   = dx * DRAG_SENS       // store for inertia
      lastX.current    = e.clientX
    }

    const onUp = () => { dragging.current = false }

    el.addEventListener('pointerdown',   onDown)
    el.addEventListener('pointermove',   onMove)
    el.addEventListener('pointerup',     onUp)
    el.addEventListener('pointercancel', onUp)

    return () => {
      el.removeEventListener('pointerdown',   onDown)
      el.removeEventListener('pointermove',   onMove)
      el.removeEventListener('pointerup',     onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    <div
      className="relative w-full"
      style={{ height: `${CARD_H + 24}px`, overflow: 'hidden' }}
    >
      {/* ── Scrolling track ── */}
      <div
        ref={trackRef}
        className="absolute top-0 left-0 flex cursor-grab active:cursor-grabbing"
        style={{
          gap:        `${GAP}px`,
          paddingTop: '12px',
          willChange: 'transform',
          userSelect: 'none',
          // pan-y lets the browser keep vertical page scroll while we own the
          // horizontal drag — without this, touch devices hijack the gesture
          // for scrolling and the carousel stutters / won't swipe.
          touchAction: 'pan-y',
        }}
      >
        {tiles.map((img, i) => (
          <div
            key={`tile-${i}`}
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              width:           `${CARD_W}px`,
              height:          `${CARD_H}px`,
              border:          '1px solid rgba(201,169,110,0.15)',
              backgroundColor: '#161310',
            }}
          >
            {loading ? (
              <Skeleton />
            ) : img ? (
              <img
                src={(img as GalleryImage).url}
                alt={(img as GalleryImage).alt_text ?? `Trabajo ${(i % slots.length) + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <Placeholder index={i % slots.length} />
            )}
          </div>
        ))}
      </div>

      {/* ── Edge fades ── */}
      <div
        className="absolute inset-y-0 left-0 w-24 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to right, #161310, transparent)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-24 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to left, #161310, transparent)' }}
      />
    </div>
  )
}
