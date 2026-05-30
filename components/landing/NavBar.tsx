'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { List, X } from '@phosphor-icons/react'

const navLinks = [
  { label: 'Sobre mi', href: '#sobre-mi' },
  { label: 'Trabajos', href: '#trabajos' },
  { label: 'Reservar', href: '#reservar' },
]

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleNavClick(href: string) {
    setMenuOpen(false)
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <motion.nav
        initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
        aria-label="Navegacion principal"
      >
        <div
          className="flex items-center justify-between px-5 py-3 rounded-full transition-all duration-300"
          style={{
            background: scrolled
              ? 'rgba(10,10,10,0.85)'
              : 'rgba(10,10,10,0.4)',
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
            aria-label="Rodrigo Barberia - Inicio"
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
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200"
                style={{ color: '#888888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F5')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#reservar"
              onClick={(e) => { e.preventDefault(); handleNavClick('#reservar') }}
              className="ml-2 px-5 py-2 rounded-full text-sm font-semibold transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
            >
              Reservar cita
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-full transition-colors"
            style={{ color: '#F5F5F5' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center md:hidden"
            style={{ backgroundColor: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)' }}
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
                  style={{ color: '#F5F5F5' }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#reservar"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => { e.preventDefault(); handleNavClick('#reservar') }}
                className="mt-4 px-8 py-3 rounded-full text-base font-semibold"
                style={{ backgroundColor: '#C9A96E', color: '#0A0A0A' }}
              >
                Reservar cita
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
