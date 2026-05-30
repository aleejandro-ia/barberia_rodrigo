'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarBlank, CalendarDots, Images, Clock, SignOut, ArrowsLeftRight, Sliders, ArrowLeft } from '@phosphor-icons/react'

const navLinks = [
  { href: '/admin', label: 'Citas', Icon: CalendarBlank },
  { href: '/admin/agenda', label: 'Agenda', Icon: CalendarDots },
  { href: '/admin/gallery', label: 'Galería', Icon: Images },
  { href: '/admin/before-after', label: 'Antes/Después', Icon: ArrowsLeftRight },
  { href: '/admin/schedule', label: 'Horarios', Icon: Clock },
  { href: '/admin/settings', label: 'Imágenes', Icon: Sliders },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
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
        {/* Logo + links */}
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-xl font-bold tracking-tight select-none"
            style={{ color: '#C9A96E' }}
          >
            R.
          </Link>

          <span className="text-xs font-medium uppercase tracking-widest hidden sm:block" style={{ color: '#4A4540' }}>
            Panel Admin
          </span>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(link.href)
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200"
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
  )
}
