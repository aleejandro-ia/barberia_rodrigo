'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Item {
  id: string
  before_url: string
  after_url: string
  description: string | null
  display_order: number
}

interface Props {
  items: Item[]
  onRefresh: () => void
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#1C1915',
  border: '1px solid rgba(201,169,110,0.15)',
  color: '#F2EDE7',
  borderRadius: '0.75rem',
  padding: '0.65rem 0.875rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#7A7268',
  display: 'block',
  marginBottom: '0.5rem',
}

function UploadBox({ label, file, preview, onSelect }: {
  label: string
  file: File | null
  preview: string | null
  onSelect: (f: File | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <label
        className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl transition-all"
        style={{
          border: '1px dashed rgba(201,169,110,0.2)',
          backgroundColor: 'rgba(201,169,110,0.02)',
          minHeight: preview ? 'auto' : 100,
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)')}
      >
        {preview ? (
          <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
            <Image src={preview} alt="preview" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 py-6 px-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'rgba(201,169,110,0.4)' }}>
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 9v6M9 12l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs text-center" style={{ color: '#7A7268' }}>
              {file ? file.name : 'Seleccionar imagen'}
            </span>
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

export default function BeforeAfterManager({ items, onRefresh }: Props) {
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile]   = useState<File | null>(null)
  const [beforePrev, setBeforePrev] = useState<string | null>(null)
  const [afterPrev, setAfterPrev]   = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  function handleFileSelect(type: 'before' | 'after', f: File | null) {
    if (type === 'before') {
      setBeforeFile(f)
      setBeforePrev(f ? URL.createObjectURL(f) : null)
    } else {
      setAfterFile(f)
      setAfterPrev(f ? URL.createObjectURL(f) : null)
    }
    setUploadError(null)
    setUploadSuccess(false)
  }

  async function handleUpload() {
    if (!beforeFile || !afterFile) return
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const fd = new FormData()
      fd.append('before_file', beforeFile)
      fd.append('after_file', afterFile)
      if (description.trim()) fd.append('description', description.trim())
      fd.append('display_order', String(items.length))
      const res = await fetch('/api/admin/before-after', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      setBeforeFile(null); setAfterFile(null); setBeforePrev(null); setAfterPrev(null)
      setDescription('')
      setUploadSuccess(true)
      onRefresh()
    } catch {
      setUploadError('Error al subir. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/before-after?id=${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      onRefresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Upload new pair */}
      <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9A96E' }}>
          Añadir transformación
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <UploadBox label="Foto ANTES" file={beforeFile} preview={beforePrev} onSelect={(f) => handleFileSelect('before', f)} />
          <UploadBox label="Foto DESPUÉS" file={afterFile} preview={afterPrev} onSelect={(f) => handleFileSelect('after', f)} />
        </div>
        <div className="mb-4">
          <label style={labelStyle}>Descripción (opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Fade + degradado"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.15)')}
          />
        </div>
        {uploadError && (
          <p className="text-sm mb-4 px-3 py-2 rounded-xl" style={{ color: '#FF8080', backgroundColor: 'rgba(255,128,128,0.08)', border: '1px solid rgba(255,128,128,0.2)' }}>
            {uploadError}
          </p>
        )}
        {uploadSuccess && (
          <p className="text-sm mb-4 px-3 py-2 rounded-xl" style={{ color: '#4ADE80', backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            ✓ Transformación añadida
          </p>
        )}
        <button
          onClick={handleUpload}
          disabled={!beforeFile || !afterFile || uploading}
          className="py-3 px-8 rounded-full text-sm font-semibold transition-all"
          style={{
            backgroundColor: beforeFile && afterFile && !uploading ? '#C9A96E' : 'rgba(201,169,110,0.15)',
            color: beforeFile && afterFile && !uploading ? '#0E0B08' : '#4A4540',
            cursor: beforeFile && afterFile && !uploading ? 'pointer' : 'not-allowed',
          }}
        >
          {uploading ? 'Subiendo…' : 'Añadir par'}
        </button>
      </div>

      {/* Existing pairs */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#C9A96E' }}>Transformaciones</h2>
        <span className="text-xs" style={{ color: '#4A4540' }}>{items.length} par{items.length !== 1 ? 'es' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-16 rounded-2xl" style={{ backgroundColor: '#161310', border: '1px dashed rgba(201,169,110,0.1)' }}>
          <p className="text-sm" style={{ color: '#4A4540' }}>No hay transformaciones todavía</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div key={item.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.08)' }}>
              <div className="grid grid-cols-2 gap-0.5 bg-[#0E0B08]">
                <div className="relative" style={{ aspectRatio: '3/4' }}>
                  <Image src={item.before_url} alt="Antes" fill className="object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(14,11,8,0.75)', color: '#7A7268' }}>Antes</span>
                </div>
                <div className="relative" style={{ aspectRatio: '3/4' }}>
                  <Image src={item.after_url} alt="Después" fill className="object-cover" />
                  <span className="absolute bottom-1.5 right-1.5 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(14,11,8,0.75)', color: '#C9A96E' }}>Después</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs" style={{ color: '#7A7268' }}>
                  {item.description ?? `Transformación ${i + 1}`}
                </span>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FF8080'; e.currentTarget.style.borderColor = 'rgba(255,128,128,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#7A7268'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar transformación</DialogTitle>
            <DialogDescription>¿Eliminar este par antes/después? No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.08)' }}>Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(255,80,80,0.15)', color: '#FF8080', border: '1px solid rgba(255,80,80,0.25)' }}>
              {deleting ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
