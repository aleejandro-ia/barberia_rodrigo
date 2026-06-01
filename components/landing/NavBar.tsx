'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { List, X, CalendarBlank, SignOut, User } from '@phosphor-icons/react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth/AuthModal'
import MyAppointmentModal from './MyAppointmentModal'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navLinks = [
  { label: 'Sobre mí', href: '#sobre-mi' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Trabajos', href: '#trabajos' },
  { label: 'Reservar', href: '#reservar' },
]

/* ─── Shared gold-pill icon button style ─────────────────────── */
const goldPill: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  backgroundColor: '#C9A96E',
  color:          '#0E0B08',
  borderRadius:   '9999px',
  padding:        '7px 10px',
  border:         'none',
  cursor:         'pointer',
  transition:     'opacity 0.2s',
  flexShrink:     0,
}

export default function NavBar() {
  const [scrolled,              setScrolled]              = useState(false)
  const [menuOpen,              setMenuOpen]              = useState(false)
  const [user,                  setUser]                  = useState<SupabaseUser | null>(null)
  const [isAdmin,               setIsAdmin]               = useState(false)
  const [authModalOpen,         setAuthModalOpen]         = useState(false)
  const [appointmentModalOpen,  setAppointmentModalOpen]  = useState(false)
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

  /* ─── Mobile user icon action ─────────────────────────────── */
  function MobileUserIcon() {
    if (!user) {
      return (
        <button
          style={goldPill}
          onClick={() => setAuthModalOpen(true)}
          aria-label="Iniciar sesión"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <User size={16} weight="bold" />
        </button>
      )
    }
    if (isAdmin) {
      return (
        <Link
          href="/admin"
          style={goldPill}
          aria-label="Panel Admin"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <User size={16} weight="bold" />
        </Link>
      )
    }
    return (
      <Link
        href="/mis-citas"
        style={goldPill}
        aria-label="Mis citas"
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        <CalendarBlank size={16} weight="bold" />
      </Link>
    )
  }

  return (
    <>
      <motion.nav
        initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
        aria-label="Navegación principal"
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-full transition-all duration-300"
          style={{
            background:          scrolled ? 'rgba(14,11,8,0.88)' : 'rgba(14,11,8,0.45)',
            backdropFilter:      scrolled ? 'blur(20px)' : 'blur(8px)',
            WebkitBackdropFilter:scrolled ? 'blur(20px)' : 'blur(8px)',
            border:              '1px solid rgba(201,169,110,0.12)',
          }}
        >
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="text-2xl font-bold tracking-tight select-none"
            style={{ color: '#C9A96E' }}
          >
            R.
          </a>

          {/* ── Desktop links ──────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                className="px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200"
                style={{ color: '#888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2EDE7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
              >
                {link.label}
              </a>
            ))}

            {/* Mis citas — solo usuario normal logueado (admin usa /admin/agenda) */}
            {user && !isAdmin && (
              <Link
                href="/mis-citas"
                className="ml-1 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200"
                style={{ color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)', backgroundColor: 'rgba(201,169,110,0.06)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.06)')}
              >
                <CalendarBlank size={13} weight="duotone" />
                Mis citas
              </Link>
            )}

            {/* Admin pill */}
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-200"
                style={{ color: '#0E0B08', backgroundColor: '#C9A96E' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Panel Admin
              </Link>
            )}

            {/* User / SignOut — gold pill */}
            {user ? (
              <button
                onClick={handleSignOut}
                style={{ ...goldPill, marginLeft: 4 }}
                title="Cerrar sesión"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <SignOut size={14} weight="bold" />
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                style={{ ...goldPill, marginLeft: 4 }}
                title="Iniciar sesión"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <User size={14} weight="bold" />
              </button>
            )}

            {/* CTA */}
            <a
              href="#reservar"
              onClick={(e) => { e.preventDefault(); handleNavClick('#reservar') }}
              className="ml-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
            >
              Reservar cita
            </a>
          </div>

          {/* ── Mobile top bar: user icon + hamburger ─────────── */}
          <div className="md:hidden flex items-center gap-2">
            <MobileUserIcon />
            <button
              className="p-1.5 rounded-full transition-colors"
              style={{ color: '#F2EDE7' }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile overlay (sin cambios) ───────────────────────── */}
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
              {navLinks.map((link, i) => (
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
                  transition={{ delay: navLinks.length * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                  transition={{ delay: (navLinks.length + (user ? 1 : 0)) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                  transition={{ delay: (navLinks.length + 2) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                transition={{ delay: (navLinks.length + 3) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
      />
    </>
  )
}
