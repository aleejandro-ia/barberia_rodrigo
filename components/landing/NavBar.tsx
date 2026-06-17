'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { List, X, CalendarBlank, SignOut, User, GearSix, Images } from '@phosphor-icons/react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth/AuthModal'
import MyAppointmentModal from './MyAppointmentModal'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Static nav links (always shown)
const navLinks = [
  { label: 'Sobre mí', href: '#sobre-mi' },
  { label: 'Servicios', href: '#servicios' },
]

/* ─── Gold ring circle icon style ────────────────────────────── */
const userCircle: React.CSSProperties = {
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  border:          '1.5px solid #C9A96E',
  borderRadius:    '9999px',
  padding:         '7px',
  background:      'transparent',
  color:           '#C9A96E',
  cursor:          'pointer',
  transition:      'opacity 0.2s',
  flexShrink:      0,
  textDecoration:  'none',
}

interface NavBarProps {
  /** Barber phone from booking_settings.whatsapp_phone (admin-editable). */
  whatsappPhone?: string
}

export default function NavBar({ whatsappPhone }: NavBarProps) {
  const [scrolled,             setScrolled]             = useState(false)
  const [menuOpen,             setMenuOpen]             = useState(false)
  const [user,                 setUser]                 = useState<SupabaseUser | null>(null)
  const [isAdmin,              setIsAdmin]              = useState(false)
  const [authModalOpen,        setAuthModalOpen]        = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [galleryVisible,       setGalleryVisible]       = useState(true)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) checkAdmin()
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) checkAdmin()
      else setIsAdmin(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch gallery visibility from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(({ settings }) => {
        setGalleryVisible(settings?.gallery_enabled !== 'false')
      })
      .catch(() => setGalleryVisible(true))
  }, [])

  async function checkAdmin() {
    try {
      const res  = await fetch('/api/auth/is-admin')
      const data = await res.json()
      setIsAdmin(!!data.isAdmin)
    } catch {
      setIsAdmin(false)
    }
  }

  function handleNavClick(href: string) {
    setMenuOpen(false)
    const target = document.querySelector(href)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setAppointmentModalOpen(false)
  }

  /* ─── User circle icon ────────────────────────────────────── */
  function renderUserCircle(size: number = 16) {
    if (!user) {
      return (
        <button
          style={userCircle}
          onClick={() => setAuthModalOpen(true)}
          aria-label="Iniciar sesión"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <User size={size} weight="bold" />
        </button>
      )
    }
    return (
      <Link
        href="/mis-citas"
        style={userCircle}
        aria-label="Mis citas"
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        <CalendarBlank size={size} weight="bold" />
      </Link>
    )
  }

  /* ─── Admin gear button ────────────────────────────────────── */
  function renderAdminCircle(size: number = 16) {
    if (!isAdmin) return null
    return (
      <Link
        href="/admin"
        style={userCircle}
        aria-label="Panel Admin"
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        <GearSix size={size} weight="bold" />
      </Link>
    )
  }

  /* ─── Sign out circle (desktop, logged-in only) ─────────── */
  function renderSignOutCircle(size: number = 16) {
    if (!user) return null
    return (
      <button
        style={{ ...userCircle, borderColor: 'rgba(201,169,110,0.4)' }}
        onClick={handleSignOut}
        aria-label="Cerrar sesión"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <SignOut size={size} weight="bold" />
      </button>
    )
  }

  // All visible nav items for mobile overlay (with animated index)
  const mobileNavLinks = [
    ...navLinks,
    ...(galleryVisible ? [{ label: 'Galería', href: '#trabajos' }] : []),
  ]

  return (
    <>
      <motion.nav
        initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] md:w-auto"
        aria-label="Navegación principal"
      >
        <div
          className="flex items-center justify-between px-4 py-2 rounded-full transition-all duration-300"
          style={{
            background:           scrolled ? 'rgba(14,11,8,0.88)' : 'rgba(14,11,8,0.45)',
            backdropFilter:       scrolled ? 'blur(20px)' : 'blur(8px)',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
            border:               '1px solid rgba(201,169,110,0.12)',
          }}
        >
          {/* ── LEFT: logo + user circle [+ admin gear if admin] ── */}
          <div className="flex items-center gap-2">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="text-2xl font-bold tracking-tight select-none"
              style={{ color: '#C9A96E' }}
            >
              R.
            </a>
            {renderUserCircle(16)}
            {renderAdminCircle(16)}
            <span className="hidden md:contents">{renderSignOutCircle(16)}</span>
          </div>

          {/* ── CENTER: nav links + conditional Galería (desktop) ─ */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200"
                style={{ color: '#888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2EDE7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
              >
                {link.label}
              </a>
            ))}

            {/* Galería — visible only when gallery_enabled */}
            {galleryVisible && (
              <a
                href="#trabajos"
                onClick={(e) => { e.preventDefault(); handleNavClick('#trabajos') }}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200"
                style={{ color: '#888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2EDE7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
              >
                Galería
              </a>
            )}
          </div>

          {/* ── RIGHT: CTA (desktop) + hamburger (mobile) ──────── */}
          <div className="flex items-center gap-2">
            <a
              href="#reservar"
              onClick={(e) => { e.preventDefault(); handleNavClick('#reservar') }}
              className="hidden md:inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
            >
              Reservar cita
            </a>

            <button
              className="md:hidden p-1.5 rounded-full transition-colors"
              style={{ color: '#F2EDE7' }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center md:hidden"
            style={{ backgroundColor: 'rgba(14,11,8,0.97)', backdropFilter: 'blur(20px)' }}
          >
            <nav className="flex flex-col items-center gap-8">
              {mobileNavLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                  className="text-3xl font-semibold tracking-tight"
                  style={{ color: '#F2EDE7' }}
                >
                  {link.label}
                </motion.a>
              ))}

              {user && !isAdmin && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mobileNavLinks.length * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href="/mis-citas"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-xl font-medium"
                    style={{ color: '#C9A96E' }}
                  >
                    <CalendarBlank size={20} weight="duotone" />
                    Mis citas
                  </Link>
                </motion.div>
              )}

              {isAdmin && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (mobileNavLinks.length + (user ? 1 : 0)) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest"
                    style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
                  >
                    Panel Admin
                  </Link>
                </motion.div>
              )}

              {user && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (mobileNavLinks.length + 2) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    onClick={() => { handleSignOut(); setMenuOpen(false) }}
                    className="flex items-center gap-2 text-base font-medium transition-opacity hover:opacity-70"
                    style={{ color: '#4A4540', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <SignOut size={16} />
                    Cerrar sesión
                  </button>
                </motion.div>
              )}

              <motion.a
                href="#reservar"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (mobileNavLinks.length + 3) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => { e.preventDefault(); handleNavClick('#reservar') }}
                className="mt-2 px-8 py-3 rounded-full text-base font-semibold"
                style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
              >
                Reservar cita
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <MyAppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onLoginNeeded={() => { setAppointmentModalOpen(false); setAuthModalOpen(true) }}
        userId={user?.id ?? null}
        whatsappPhone={whatsappPhone}
      />
    </>
  )
}
