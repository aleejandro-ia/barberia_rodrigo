'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { MagnifyingGlass, UsersThree, CaretRight, ArrowLeft } from '@phosphor-icons/react'
import type { ClientRecord, Barber } from '@/types'
import ClientDetail from '@/components/admin/clients/ClientDetail'

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [barberNames, setBarberNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/clients').then((r) => r.json()),
      fetch('/api/barbers').then((r) => r.json()).catch(() => ({ barbers: [] })),
    ])
      .then(([c, b]) => {
        const list: ClientRecord[] = Array.isArray(c.clients) ? c.clients : []
        setClients(list)
        const map: Record<string, string> = {}
        for (const bb of (b.barbers ?? []) as Barber[]) map[bb.id] = bb.name
        setBarberNames(map)
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')),
    )
  }, [clients, query])

  const selected = useMemo(
    () => clients.find((c) => c.key === selectedKey) ?? null,
    [clients, selectedKey],
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-meta mb-2" style={{ color: '#C9A96E', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          Panel
        </p>
        <h1
          style={{
            color: '#F2EDE7',
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontSize: '2.25rem',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          Clientes
        </h1>
        <p style={{ color: '#7A7268', fontSize: '0.9rem', marginTop: 8 }}>
          {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'} · historial completo
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
          />
        </div>
      ) : clients.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center text-center py-24 rounded-2xl"
          style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.12)' }}
        >
          <UsersThree size={40} weight="duotone" style={{ color: '#4A4540' }} />
          <p style={{ color: '#7A7268', marginTop: 14, fontSize: '0.95rem' }}>
            Aún no hay clientes. Aparecerán al recibir la primera reserva.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* List column — hidden on mobile when a client is open */}
          <div className={selected ? 'hidden lg:block' : 'block'}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <MagnifyingGlass
                size={16}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#7A7268' }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono…"
                style={{
                  width: '100%',
                  backgroundColor: '#1C1915',
                  border: '1px solid rgba(201,169,110,0.18)',
                  color: '#F2EDE7',
                  borderRadius: 12,
                  padding: '0.7rem 0.9rem 0.7rem 2.5rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.45)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.18)')}
              />
            </div>

            <div className="flex flex-col gap-2">
              {filtered.map((c) => {
                const isSel = c.key === selectedKey
                const initial = (c.name?.trim()?.[0] ?? '?').toUpperCase()
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelectedKey(c.key)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150"
                    style={{
                      backgroundColor: isSel ? 'rgba(201,169,110,0.1)' : '#161310',
                      border: `1px solid ${isSel ? 'rgba(201,169,110,0.35)' : 'rgba(201,169,110,0.1)'}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(201,169,110,0.08)',
                        border: '1px solid rgba(201,169,110,0.2)',
                        color: '#C9A96E',
                        fontWeight: 700,
                        fontFamily: 'var(--font-serif), Georgia, serif',
                      }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate" style={{ color: '#F2EDE7', fontSize: '0.92rem', fontWeight: 500 }}>
                        {c.name || 'Sin nombre'}
                      </p>
                      <p className="truncate" style={{ color: '#7A7268', fontSize: '0.78rem' }}>
                        {c.email ?? c.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: '0.7rem', color: '#A89F94', backgroundColor: '#1C1915', border: '1px solid rgba(201,169,110,0.12)' }}
                      >
                        {c.totalCount}
                      </span>
                      <CaretRight size={14} style={{ color: '#4A4540' }} />
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="text-center py-8" style={{ color: '#4A4540', fontSize: '0.88rem' }}>
                  Sin resultados para “{query}”.
                </p>
              )}
            </div>
          </div>

          {/* Detail column */}
          <div className={selected ? 'block' : 'hidden lg:block'}>
            {selected ? (
              <>
                {/* Mobile back */}
                <button
                  onClick={() => setSelectedKey(null)}
                  className="lg:hidden flex items-center gap-2 mb-4 text-sm font-medium"
                  style={{ color: '#C9A96E' }}
                >
                  <ArrowLeft size={15} weight="bold" />
                  Todos los clientes
                </button>
                <ClientDetail client={selected} barberNames={barberNames} />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden lg:flex flex-col items-center justify-center text-center h-full rounded-2xl"
                style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)', minHeight: 420 }}
              >
                <UsersThree size={36} weight="duotone" style={{ color: '#4A4540' }} />
                <p style={{ color: '#7A7268', marginTop: 12, fontSize: '0.9rem', maxWidth: 260 }}>
                  Selecciona un cliente para ver su ficha y su historial completo.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
