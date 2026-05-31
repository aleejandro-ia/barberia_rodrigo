'use client'

import { useEffect, useState } from 'react'
import { PencilSimple, Trash, Plus, Check, X } from '@phosphor-icons/react'
import type { Service } from '@/types'

/* ─── Helpers ────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border:          '1px solid rgba(201,169,110,0.2)',
  color:           '#F2EDE7',
  borderRadius:    '0.75rem',
  padding:         '0.5rem 0.75rem',
  fontSize:        '0.875rem',
  outline:         'none',
  width:           '100%',
}

/* ─── New service form ───────────────────────────────────────── */
function NewServiceForm({ onCreated }: { onCreated: () => void }) {
  const [open,     setOpen]     = useState(false)
  const [name,     setName]     = useState('')
  const [price,    setPrice]    = useState('')
  const [duration, setDuration] = useState('30')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    setLoading(true); setError(null)
    const res = await fetch('/api/admin/services', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:             name.trim(),
        price_eur:        parseFloat(price) || 0,
        duration_minutes: parseInt(duration) || 30,
      }),
    })
    setLoading(false)
    if (!res.ok) { setError('Error al crear el servicio.'); return }
    setName(''); setPrice(''); setDuration('30')
    setOpen(false)
    onCreated()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
        style={{ backgroundColor: '#C9A96E', color: '#0E0B08', border: 'none', cursor: 'pointer' }}
      >
        <Plus size={14} weight="bold" />
        Nuevo servicio
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.15)' }}
    >
      <p className="text-sm font-semibold mb-3" style={{ color: '#F2EDE7' }}>Nuevo servicio</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: '#7A7268' }}>Nombre *</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Corte + barba" maxLength={100} style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: '#7A7268' }}>Precio (€)</label>
          <input
            type="number" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="20" min="0" step="0.5" style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: '#7A7268' }}>Duración (min)</label>
          <input
            type="number" value={duration} onChange={e => setDuration(e.target.value)}
            placeholder="30" min="5" step="5" style={inputStyle}
          />
        </div>
      </div>
      {error && (
        <p className="text-xs mb-3 px-3 py-2 rounded-xl"
          style={{ color: '#FF8080', backgroundColor: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.2)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setError(null) }}
          className="flex-1 py-2 rounded-full text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.15)', color: '#7A7268', cursor: 'pointer', background: 'none' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
          style={{ backgroundColor: loading ? 'rgba(201,169,110,0.15)' : '#C9A96E', color: loading ? '#4A4540' : '#0E0B08', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Guardando…' : 'Crear servicio'}
        </button>
      </div>
    </div>
  )
}

/* ─── Service row ────────────────────────────────────────────── */
function ServiceRow({ service, onRefresh }: { service: Service; onRefresh: () => void }) {
  const [editing,     setEditing]     = useState(false)
  const [editName,    setEditName]    = useState(service.name)
  const [editPrice,   setEditPrice]   = useState(String(service.price_eur))
  const [editDur,     setEditDur]     = useState(String(service.duration_minutes))
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)

  async function handleToggleActive() {
    await fetch(`/api/admin/services/${service.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_active: !service.is_active }),
    })
    onRefresh()
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/services/${service.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:             editName.trim(),
        price_eur:        parseFloat(editPrice) || 0,
        duration_minutes: parseInt(editDur)     || 30,
      }),
    })
    setSaving(false)
    setEditing(false)
    onRefresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/admin/services/${service.id}`, { method: 'DELETE' })
    setDeleting(false)
    onRefresh()
  }

  if (editing) {
    return (
      <div
        className="rounded-xl px-4 py-3"
        style={{ backgroundColor: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.15)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
            placeholder="Nombre" maxLength={100} style={{ ...inputStyle, padding: '0.4rem 0.6rem' }} />
          <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
            placeholder="Precio €" min="0" step="0.5" style={{ ...inputStyle, padding: '0.4rem 0.6rem' }} />
          <input type="number" value={editDur} onChange={e => setEditDur(e.target.value)}
            placeholder="Minutos" min="5" step="5" style={{ ...inputStyle, padding: '0.4rem 0.6rem' }} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs"
            style={{ border: '1px solid rgba(201,169,110,0.15)', color: '#7A7268', cursor: 'pointer', background: 'none' }}
          >
            <X size={11} /> Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#C9A96E', color: '#0E0B08', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            <Check size={11} weight="bold" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
      style={{
        backgroundColor: service.is_active ? 'rgba(201,169,110,0.04)' : 'rgba(255,255,255,0.02)',
        border:          `1px solid ${service.is_active ? 'rgba(201,169,110,0.1)' : 'rgba(255,255,255,0.05)'}`,
        opacity:         service.is_active ? 1 : 0.6,
      }}
    >
      {/* Active toggle */}
      <button
        onClick={handleToggleActive}
        title={service.is_active ? 'Desactivar' : 'Activar'}
        className="w-8 h-5 rounded-full transition-all flex-shrink-0 relative"
        style={{
          backgroundColor: service.is_active ? '#C9A96E' : 'rgba(255,255,255,0.08)',
          border:          '1px solid rgba(201,169,110,0.2)',
          cursor:          'pointer',
        }}
      >
        <span
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all"
          style={{
            backgroundColor: service.is_active ? '#0E0B08' : '#4A4540',
            left:            service.is_active ? '14px' : '2px',
          }}
        />
      </button>

      {/* Name */}
      <span className="flex-1 text-sm font-medium" style={{ color: '#F2EDE7' }}>
        {service.name}
      </span>

      {/* Price */}
      <span className="text-sm tabular-nums" style={{ color: '#C9A96E', minWidth: 48, textAlign: 'right' }}>
        {service.price_eur}€
      </span>

      {/* Duration */}
      <span className="text-xs" style={{ color: '#7A7268', minWidth: 48, textAlign: 'right' }}>
        {service.duration_minutes} min
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          title="Editar"
          onClick={() => setEditing(true)}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.15)', backgroundColor: 'transparent', color: '#7A7268', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <PencilSimple size={12} />
        </button>

        {confirmDel ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,80,80,0.15)', color: '#FF8080', border: '1px solid rgba(255,80,80,0.25)', cursor: 'pointer' }}
            >
              {deleting ? '…' : 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="px-2 py-1 rounded-lg text-xs"
              style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.06)', background: 'none', cursor: 'pointer' }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            title="Eliminar"
            onClick={() => setConfirmDel(true)}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
            style={{ border: '1px solid rgba(255,80,80,0.12)', backgroundColor: 'transparent', color: '#FF8080', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,80,80,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  async function fetchServices() {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/services')
      const data = await res.json()
      setServices(data.services ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
            Panel Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
            Servicios
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A7268' }}>
            Gestiona los servicios disponibles para reservas.
          </p>
        </div>
      </div>

      {/* New service form */}
      <NewServiceForm onCreated={fetchServices} />

      {/* Services list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
        </div>
      ) : error ? (
        <p className="text-sm text-center py-16" style={{ color: '#FF8080' }}>
          Error al cargar los servicios.
        </p>
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: '#4A4540' }}>Sin servicios. Crea el primero.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-4">
          {/* Table header */}
          <div className="grid px-4 pb-1" style={{ gridTemplateColumns: '2rem 1fr 4rem 4rem 3rem' }}>
            <span />
            <span className="text-xs uppercase tracking-widest" style={{ color: '#3A3530' }}>Nombre</span>
            <span className="text-xs uppercase tracking-widest text-right" style={{ color: '#3A3530' }}>Precio</span>
            <span className="text-xs uppercase tracking-widest text-right" style={{ color: '#3A3530' }}>Duración</span>
            <span />
          </div>
          {services.map(s => (
            <ServiceRow key={s.id} service={s} onRefresh={fetchServices} />
          ))}
        </div>
      )}
    </div>
  )
}
