'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDots, Images, Clock, SignOut, ArrowLeft, Scissors, Gear, UsersThree,
  Sun, DotsThreeOutline, X,
} from '@phosphor-icons/react'

const navLinks = [
  { href: '/admin/hoy',      label: 'Hoy',       Icon: Sun },
  { href: '/admin/agenda',   label: 'Agenda',    Icon: CalendarDots },
  { href: '/admin/clients',  label: 'Clientes',  Icon: UsersThree },
  { href: '/admin/services', label: 'Servicios', Icon: Scissors },
  { href: '/admin/media',    label: 'Media',     Icon: Images },
  { href: '/admin/schedule', label: 'Horarios',  Icon: Clock },
  { href: '/admin/ajustes',  label: 'Ajustes',   Icon: Gear },
]

// Mobile bottom bar: keep 4 primary tabs + a "Más" overflow to avoid cramping.
const mobilePrimary = navLinks.slice(0, 4)            // Hoy, Agenda, Clientes, Servicios
const mobileMore    = navLinks.slice(4)               // Media, Horarios, Ajustes

export default function AdminNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = mobileMore.some((l) => pathname.startsWith(l.href))

  return (
    <>
      {/* ── Top bar (always visible) ───────────────────────────── */}
      <nav
        className="sticky top-0 z-40"
        style={{
          backgroundColor: 'rgba(14,11,8,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(201,169,110,0.1)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold tracking-tight select-none" style={{ color: '#C9A96E' }}>
              R.
            </Link>

            <span className="text-xs font-medium uppercase tracking-widest hidden sm:block" style={{ color: '#4A4540' }}>
              Panel Admin
            </span>

            {/* Desktop nav links — hidden on mobile */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      color: isActive ? '#C9A96E' : '#7A7268',
                      backgroundColor: isActive ? 'rgba(201,169,110,0.1)' : 'transparent',
                      border: isActive ? '1px solid rgba(201,169,110,0.2)' : '1px solid transparent',
                    }}
                  >
                    <link.Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200"
              style={{ color: '#4A4540' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A96E')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4A4540')}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Volver al sitio</span>
            </Link>

            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200"
                style={{ color: '#4A4540' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2EDE7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4A4540')}
              >
                <SignOut size={14} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* ── Mobile "Más" overflow sheet ────────────────────────── */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(8,6,4,0.6)', backdropFilter: 'blur(2px)' }} />
          <div
            className="absolute left-0 right-0 rounded-t-3xl px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+80px)]"
            style={{ bottom: 0, backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7A7268' }}>Más opciones</span>
              <button onClick={() => setMoreOpen(false)} aria-label="Cerrar" className="flex items-center justify-center w-8 h-8 rounded-full" style={{ color: '#7A7268', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <X size={15} weight="bold" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {mobileMore.map((link) => {
                const isActive = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                    style={{
                      color: isActive ? '#C9A96E' : '#C9B79A',
                      backgroundColor: isActive ? 'rgba(201,169,110,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.04)'}`,
                    }}
                  >
                    <link.Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                )
              })}
              <Link
                href="/"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mt-1"
                style={{ color: '#7A7268', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">Volver al sitio</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom tab bar ──────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          backgroundColor: 'rgba(14,11,8,0.96)',
          borderTop: '1px solid rgba(201,169,110,0.15)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex h-[60px]">
          {mobilePrimary.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200"
                style={{ color: isActive ? '#C9A96E' : '#4A4540' }}
              >
                <link.Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                <span className="text-[10px] font-medium leading-none">{link.label}</span>
              </Link>
            )
          })}
          {/* Más */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200"
            style={{ color: moreActive || moreOpen ? '#C9A96E' : '#4A4540' }}
          >
            <DotsThreeOutline size={20} weight={moreActive ? 'fill' : 'regular'} />
            <span className="text-[10px] font-medium leading-none">Más</span>
          </button>
        </div>
      </nav>
    </>
  )
}
