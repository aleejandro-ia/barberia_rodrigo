'use client'

import { useEffect, useState } from 'react'
import { PencilSimple, Trash, Plus, Check, X } from '@phosphor-icons/react'
import type { Service } from '@/types'
import { SERVICE_ICON_OPTIONS } from '@/components/landing/serviceIcons'

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

/* ─── Small toggle switch ────────────────────────────────────── */
function Toggle({ on, onClick, title }: { on: boolean; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-5 rounded-full transition-all flex-shrink-0 relative"
      style={{
        backgroundColor: on ? '#C9A96E' : 'rgba(255,255,255,0.08)',
        border:          '1px solid rgba(201,169,110,0.2)',
        cursor:          'pointer',
      }}
    >
      <span
        className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all"
        style={{ backgroundColor: on ? '#0E0B08' : '#4A4540', left: on ? '14px' : '2px' }}
      />
    </button>
  )
}

/* ─── New service form ───────────────────────────────────────── */
function NewServiceForm({ onCreated }: { onCreated: () => void }) {
  const [open,     setOpen]     = useState(false)
  const [name,     setName]     = useState('')
  const [desc,     setDesc]     = useState('')
  const [price,    setPrice]    = useState('')
  const [duration, setDuration] = useState('30')
  const [iconKey,  setIconKey]  = useState('scissors')
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
        description:      desc.trim() || null,
        icon_key:         iconKey,
        price_eur:        parseFloat(price) || 0,
        duration_minutes: parseInt(duration) || 30,
      }),
    })
    setLoading(false)
    if (!res.ok) { setError('Error al crear el servicio.'); return }
    setName(''); setDesc(''); setPrice(''); setDuration('30'); setIconKey('scissors')
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: '#7A7268' }}>Nombre *</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Corte + barba" maxLength={100} style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: '#7A7268' }}>Icono (landing)</label>
          <select value={iconKey} onChange={e => setIconKey(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {SERVICE_ICON_OPTIONS.map(o => (
              <option key={o.key} value={o.key} style={{ backgroundColor: '#1A1A1A' }}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs block mb-1" style={{ color: '#7A7268' }}>Descripción (landing)</label>
        <textarea
          value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Texto que aparece en el card de la landing" maxLength={200} rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
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
  const [editing,   setEditing]   = useState(false)
  const [editName,  setEditName]  = useState(service.name)
  const [editDesc,  setEditDesc]  = useState(service.description ?? '')
  const [editPrice, setEditPrice] = useState(String(service.price_eur))
  const [editDur,   setEditDur]   = useState(String(service.duration_minutes))
  const [editIcon,  setEditIcon]  = useState(service.icon_key ?? 'scissors')
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const landingOn = service.show_in_landing ?? true
  const bookingOn = service.show_in_booking ?? true

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/admin/services/${service.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    onRefresh()
  }

  async function handleSave() {
    setSaving(true)
    await patch({
      name:             editName.trim(),
      description:      editDesc.trim() || null,
      icon_key:         editIcon,
      price_eur:        parseFloat(editPrice) || 0,
      duration_minutes: parseInt(editDur)     || 30,
    })
    setSaving(false)
    setEditing(false)
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
            placeholder="Nombre" maxLength={100} style={{ ...inputStyle, padding: '0.4rem 0.6rem' }} />
          <select value={editIcon} onChange={e => setEditIcon(e.target.value)}
            style={{ ...inputStyle, padding: '0.4rem 0.6rem', cursor: 'pointer' }}>
            {SERVICE_ICON_OPTIONS.map(o => (
              <option key={o.key} value={o.key} style={{ backgroundColor: '#1A1A1A' }}>{o.label}</option>
            ))}
          </select>
        </div>
        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
          placeholder="Descripción (landing)" maxLength={200} rows={2}
          style={{ ...inputStyle, padding: '0.4rem 0.6rem', resize: 'vertical', marginBottom: '0.5rem' }} />
        <div className="grid grid-cols-2 gap-2 mb-3">
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

  const visible = landingOn || bookingOn

  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
      style={{
        backgroundColor: visible ? 'rgba(201,169,110,0.04)' : 'rgba(255,255,255,0.02)',
        border:          `1px solid ${visible ? 'rgba(201,169,110,0.1)' : 'rgba(255,255,255,0.05)'}`,
        opacity:         visible ? 1 : 0.6,
      }}
    >
      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate" style={{ color: '#F2EDE7' }}>
          {service.name}
        </span>
        {service.description && (
          <span className="text-xs block truncate" style={{ color: '#5A5450' }}>
            {service.description}
          </span>
        )}
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-center gap-1">
          <Toggle on={landingOn} onClick={() => patch({ show_in_landing: !landingOn })} title="Mostrar en landing" />
          <span className="text-[0.6rem] uppercase tracking-wide" style={{ color: '#4A4540' }}>Landing</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Toggle on={bookingOn} onClick={() => patch({ show_in_booking: !bookingOn })} title="Mostrar al reservar" />
          <span className="text-[0.6rem] uppercase tracking-wide" style={{ color: '#4A4540' }}>Reserva</span>
        </div>
      </div>

      {/* Price */}
      <span className="text-sm tabular-nums flex-shrink-0" style={{ color: '#C9A96E', minWidth: 48, textAlign: 'right' }}>
        {service.price_eur}€
      </span>

      {/* Duration */}
      <span className="text-xs flex-shrink-0" style={{ color: '#7A7268', minWidth: 48, textAlign: 'right' }}>
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
            Edita nombre, descripción y precio. Controla si cada servicio sale en la landing y/o al reservar.
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
          {services.map(s => (
            <ServiceRow key={s.id} service={s} onRefresh={fetchServices} />
          ))}
        </div>
      )}
    </div>
  )
}
