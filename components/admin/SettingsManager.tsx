'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { toggleSection, type SectionKey } from '@/actions/settings'

interface Settings {
  hero_image:           string | null
  about_portrait:       string | null
  gallery_enabled:      boolean
  before_after_enabled: boolean
}

interface Props {
  settings:  Settings
  onRefresh: () => void
}

/* ─── Shared input style ──────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border:          '1px solid rgba(201,169,110,0.15)',
  color:           '#F2EDE7',
  borderRadius:    '0.75rem',
  padding:         '0.65rem 0.875rem',
  fontSize:        '0.875rem',
  outline:         'none',
  width:           '100%',
  transition:      'border-color 0.15s',
}

/* ─── Image upload card ───────────────────────────────────── */
interface ImageCardProps {
  title:       string
  description: string
  settingKey:  'hero_image' | 'about_portrait'
  currentUrl:  string | null
  aspect:      string
  onUploaded:  () => void
}

function ImageCard({ title, description, settingKey, currentUrl, aspect, onUploaded }: ImageCardProps) {
  const [file,      setFile]      = useState<File | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError(null)
    setSuccess(false)
    if (f) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(false)
    try {
      const fd = new FormData()
      fd.append('key', settingKey)
      fd.append('file', file)
      const res = await fetch('/api/admin/settings', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      setFile(null)
      setPreview(null)
      setSuccess(true)
      if (fileRef.current) fileRef.current.value = ''
      onUploaded()
    } catch {
      setError('Error al subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>{title}</h2>
      <p className="text-xs mb-5" style={{ color: '#7A7268' }}>{description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
        {/* Preview */}
        <div
          className="relative flex-shrink-0 rounded-xl overflow-hidden"
          style={{
            width:           140,
            aspectRatio:     aspect,
            border:          displayUrl ? '1px solid rgba(201,169,110,0.2)' : '1px dashed rgba(201,169,110,0.15)',
            backgroundColor: '#1C1915',
          }}
        >
          {displayUrl ? (
            <Image src={displayUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'rgba(201,169,110,0.3)' }}>
                <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="14" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 23c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="text-xs" style={{ color: 'rgba(201,169,110,0.3)' }}>Sin foto</span>
            </div>
          )}
          {preview && (
            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: 'rgba(201,169,110,0.9)', color: '#0E0B08' }}>
              Nueva
            </div>
          )}
        </div>

        {/* Upload controls */}
        <div className="flex flex-col gap-3">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={inputStyle} />
          {error && (
            <p className="text-xs px-3 py-2 rounded-xl"
              style={{ color: '#FF8080', backgroundColor: 'rgba(255,128,128,0.08)', border: '1px solid rgba(255,128,128,0.2)' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs px-3 py-2 rounded-xl"
              style={{ color: '#4ADE80', backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
              ✓ Imagen actualizada correctamente
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="py-2.5 px-6 rounded-full text-sm font-semibold transition-all self-start"
            style={{
              backgroundColor: file && !uploading ? '#C9A96E' : 'rgba(201,169,110,0.15)',
              color:            file && !uploading ? '#0E0B08' : '#4A4540',
              cursor:           file && !uploading ? 'pointer' : 'not-allowed',
            }}
          >
            {uploading ? 'Subiendo…' : currentUrl ? 'Actualizar foto' : 'Subir foto'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Section toggle card ─────────────────────────────────── */
interface SectionToggleCardProps {
  title:       string
  description: string
  sectionKey:  SectionKey
  enabled:     boolean
  onRefresh:   () => void
}

function SectionToggleCard({ title, description, sectionKey, enabled, onRefresh }: SectionToggleCardProps) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)
    const result = await toggleSection(sectionKey, !enabled)
    if ('error' in result) setError('Error al guardar. Inténtalo de nuevo.')
    else onRefresh()
    setLoading(false)
  }

  return (
    <div
      className="rounded-2xl p-5 flex items-center justify-between gap-4"
      style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: '#F2EDE7' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#7A7268' }}>{description}</p>
        {error && <p className="text-xs mt-1" style={{ color: '#FF8080' }}>{error}</p>}
      </div>

      {/* Toggle switch */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex-shrink-0 relative transition-opacity"
        style={{ opacity: loading ? 0.6 : 1 }}
        aria-label={enabled ? `Desactivar ${title}` : `Activar ${title}`}
      >
        <div
          className="w-12 h-6 rounded-full transition-colors duration-200"
          style={{ backgroundColor: enabled ? '#C9A96E' : 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-200"
            style={{
              left:            enabled ? '26px' : '2px',
              backgroundColor: enabled ? '#0E0B08' : '#4A4540',
            }}
          />
        </div>
      </button>
    </div>
  )
}

/* ─── Main export ─────────────────────────────────────────── */
export default function SettingsManager({ settings, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-8">

      {/* Images */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: '#4A4540' }}>
          Imágenes
        </p>
        <div className="flex flex-col gap-4">
          <ImageCard
            title="Foto de Hero"
            description="Fondo del hero principal. Recomendado: foto vertical o landscape de alta resolución."
            settingKey="hero_image"
            currentUrl={settings.hero_image}
            aspect="16/9"
            onUploaded={onRefresh}
          />
          <ImageCard
            title="Retrato de Rodrigo"
            description="Foto del barbero en la sección 'Sobre mí'. Recomendado: retrato vertical 4:5."
            settingKey="about_portrait"
            currentUrl={settings.about_portrait}
            aspect="4/5"
            onUploaded={onRefresh}
          />
        </div>
      </div>

      {/* Section visibility */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: '#4A4540' }}>
          Visibilidad de secciones
        </p>
        <div className="flex flex-col gap-3">
          <SectionToggleCard
            title="Galería de trabajos"
            description="Activa o desactiva la sección de fotos del carrusel."
            sectionKey="gallery_enabled"
            enabled={settings.gallery_enabled}
            onRefresh={onRefresh}
          />
          <SectionToggleCard
            title="Antes & Después"
            description="Activa o desactiva la sección de transformaciones."
            sectionKey="before_after_enabled"
            enabled={settings.before_after_enabled}
            onRefresh={onRefresh}
          />
        </div>
      </div>

    </div>
  )
}
