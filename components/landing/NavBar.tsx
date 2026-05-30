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

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
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
      const res = await fetch('/api/auth/is-admin')
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

  function handleMisCitasClick() {
    if (!user) setAuthModalOpen(true)
    else setAppointmentModalOpen(true)
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
          className="flex items-center justify-between px-5 py-3 rounded-full transition-all duration-300"
          style={{
            background: scrolled ? 'rgba(14,11,8,0.88)' : 'rgba(14,11,8,0.45)',
            backdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
            border: '1px solid rgba(201,169,110,0.12)',
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

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                className="px-4 py-1.5 rounded-full text-base font-medium transition-colors duration-200"
                style={{ color: '#888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2EDE7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
              >
                {link.label}
              </a>
            ))}

            {/* Mis citas */}
            <button
              onClick={handleMisCitasClick}
              className="ml-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-medium transition-all duration-200"
              style={{ color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)', backgroundColor: 'rgba(201,169,110,0.06)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.06)')}
            >
              <CalendarBlank size={14} weight="duotone" />
              Mis citas
            </button>

            {/* Admin button — only visible when logged in as admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold uppercase tracking-widest transition-all duration-200"
                style={{ color: '#0E0B08', backgroundColor: '#C9A96E' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                ⚙ Admin
              </Link>
            )}

            {user ? (
              <button
                onClick={handleSignOut}
                className="ml-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm transition-colors duration-200"
                style={{ color: '#555' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2EDE7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                title="Cerrar sesión"
              >
                <SignOut size={14} />
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="ml-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm transition-colors duration-200"
                style={{ color: '#555' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2EDE7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                title="Iniciar sesión"
              >
                <User size={14} />
              </button>
            )}

            <a
              href="#reservar"
              onClick={(e) => { e.preventDefault(); handleNavClick('#reservar') }}
              className="ml-2 px-5 py-2 rounded-full text-base font-semibold transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
            >
              Reservar cita
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-full transition-colors"
            style={{ color: '#F2EDE7' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
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

              <motion.button
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => { setMenuOpen(false); handleMisCitasClick() }}
                className="flex items-center gap-2 text-xl font-medium"
                style={{ color: '#C9A96E' }}
              >
                <CalendarBlank size={20} weight="duotone" />
                Mis citas
              </motion.button>

              {isAdmin && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (navLinks.length + 1) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest"
                    style={{ backgroundColor: '#C9A96E', color: '#0E0B08' }}
                  >
                    ⚙ Panel Admin
                  </Link>
                </motion.div>
              )}

              <motion.a
                href="#reservar"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (navLinks.length + 2) * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
