'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X, Lock, Check, UserCircle, Info } from '@phosphor-icons/react'
import { updateMyProfile } from '@/actions/profile'

interface MisDatosModalProps {
  open: boolean
  onClose: () => void
  variant?: 'default' | 'onboarding'
}

export default function MisDatosModal({ open, onClose, variant = 'default' }: MisDatosModalProps) {
  const isOnboarding = variant === 'onboarding'
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => setMounted(true), [])

  // Load profile when opened
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setSaved(false)
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile) {
          setEmail(d.profile.email ?? null)
          setName(d.profile.full_name ?? '')
          setPhone(d.profile.phone ?? '')
        }
      })
      .catch(() => setError('No se pudieron cargar tus datos.'))
      .finally(() => setLoading(false))
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (!name.trim() || name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    const cleanPhone = phone.replace(/\s/g, '')
    if (!/^\d{9}$/.test(cleanPhone)) {
      setError('El teléfono debe tener 9 dígitos, sin prefijo.')
      return
    }

    setSaving(true)
    const res = await updateMyProfile({ full_name: name.trim(), phone: cleanPhone })
    setSaving(false)

    if ('error' in res) {
      setError(
        res.error === 'VALIDATION_ERROR'
          ? 'Revisa los datos introducidos.'
          : 'No se pudo guardar. Inténtalo de nuevo.'
      )
      return
    }
    setSaved(true)
    setTimeout(() => onClose(), 900)
  }

  const inputStyle = {
    backgroundColor: '#1C1915',
    border: '1px solid rgba(201,169,110,0.2)',
    color: '#F2EDE7',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  } as const

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ backgroundColor: 'rgba(8,6,4,0.78)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl overflow-y-auto"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: '#161310',
              border: '1px solid rgba(201,169,110,0.18)',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid rgba(201,169,110,0.1)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-2xl"
                  style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}
                >
                  <UserCircle size={22} weight="duotone" style={{ color: '#C9A96E' }} />
                </div>
                <div>
                  <h2
                    className="text-lg font-semibold leading-tight"
                    style={{ color: '#F2EDE7', fontFamily: 'var(--font-serif)' }}
                  >
                    {isOnboarding ? '¡Bienvenido!' : 'Mis datos'}
                  </h2>
                  <p className="text-xs" style={{ color: '#7A7268' }}>
                    {isOnboarding ? 'Completa tu perfil' : 'Se usan al reservar tus citas'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150"
                style={{ color: '#7A7268', backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }}
                  />
                </div>
              ) : (
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  {isOnboarding && (
                    <div
                      className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: 'rgba(201,169,110,0.07)',
                        border: '1px solid rgba(201,169,110,0.18)',
                      }}
                    >
                      <Info size={16} weight="fill" style={{ color: '#C9A96E', flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs leading-relaxed" style={{ color: '#C9B79A' }}>
                        Esto se guardará como predeterminado y se rellenará solo al
                        reservar. ¿Necesitas cambiarlo? Entra en{' '}
                        <span style={{ color: '#F2EDE7', fontWeight: 600 }}>Mis citas → Mis datos</span>.
                      </p>
                    </div>
                  )}

                  {/* Email — read only */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: '#7A7268' }}>
                      Correo
                    </label>
                    <div
                      className="flex items-center gap-2 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: '#13110E', border: '1px solid rgba(201,169,110,0.08)' }}
                    >
                      <Lock size={14} weight="fill" style={{ color: '#4A4540', flexShrink: 0 }} />
                      <span className="text-sm truncate" style={{ color: '#A89F94' }}>
                        {email ?? '—'}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: '#4A4540' }}>
                      Vinculado a tu cuenta de Google · no editable
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-name" className="text-xs font-medium" style={{ color: '#7A7268' }}>
                      Nombre
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      maxLength={100}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.6)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-phone" className="text-xs font-medium" style={{ color: '#7A7268' }}>
                      Teléfono
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="600 123 456"
                      maxLength={20}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.6)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.2)')}
                    />
                    <span className="text-xs" style={{ color: '#4A4540' }}>9 dígitos, sin prefijo</span>
                  </div>

                  {error && (
                    <div
                      className="px-4 py-3 rounded-xl text-sm"
                      style={{
                        backgroundColor: 'rgba(255,80,80,0.08)',
                        border: '1px solid rgba(255,80,80,0.2)',
                        color: '#FF8080',
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving || saved}
                    className="mt-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70"
                    style={{
                      backgroundColor: saved ? '#4ADE80' : '#C9A96E',
                      color: '#0E0B08',
                    }}
                  >
                    {saved ? (
                      <><Check size={16} weight="bold" /> Guardado</>
                    ) : saving ? (
                      'Guardando…'
                    ) : isOnboarding ? (
                      'Guardar y continuar'
                    ) : (
                      'Guardar cambios'
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
