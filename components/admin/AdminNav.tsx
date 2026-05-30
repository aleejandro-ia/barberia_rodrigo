'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/admin', label: 'Citas' },
  { href: '/admin/gallery', label: 'Galería' },
  { href: '/admin/schedule', label: 'Horarios' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
            Barbería Rodrigo — Admin
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
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
        <form action="/auth/sign-out" method="POST">
          <button
            type="submit"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-md hover:bg-zinc-800"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  )
}
