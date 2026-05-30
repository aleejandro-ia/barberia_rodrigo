'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { deleteGalleryImage } from '@/actions/gallery'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { GalleryImage } from '@/types'

interface Props {
  images: GalleryImage[]
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

export default function GalleryManager({ images, onRefresh }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [altText, setAltText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setUploadError(null)
    setUploadSuccess(false)
    if (selected) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(selected)
    } else {
      setPreview(null)
    }
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (altText.trim()) formData.append('alt_text', altText.trim())
      formData.append('display_order', String(images.length))
      const res = await fetch('/api/admin/gallery', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Upload failed')
      }
      setFile(null)
      setPreview(null)
      setAltText('')
      setUploadSuccess(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onRefresh()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const result = await deleteGalleryImage(deleteTarget.id)
      if ('error' in result) {
        setDeleteError('Error al eliminar la imagen.')
      } else {
        setDeleteTarget(null)
        onRefresh()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Upload section */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{ backgroundColor: '#161310', border: '1px solid rgba(201,169,110,0.1)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9A96E' }}>
          Subir imagen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="flex flex-col gap-4">
            {/* File dropzone */}
            <div>
              <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: '#7A7268' }}>
                Archivo
              </label>
              <label
                className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl transition-all duration-200"
                style={{
                  border: '1px dashed rgba(201,169,110,0.25)',
                  backgroundColor: 'rgba(201,169,110,0.03)',
                  padding: '2rem',
                  minHeight: '120px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.25)')}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'rgba(201,169,110,0.5)' }}>
                  <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 10v8M10 14l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-medium" style={{ color: '#7A7268' }}>
                  {file ? file.name : 'Haz clic para seleccionar imagen'}
                </span>
                <span className="text-xs" style={{ color: '#4A4540' }}>
                  JPG, PNG, WEBP
                </span>
                <input
                  ref={fileInputRef}
                  id="gallery-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Alt text */}
            <div>
              <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: '#7A7268' }}>
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Ej: Fade con degradado"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.15)')}
              />
            </div>

            {/* Messages */}
            {uploadError && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#FF8080', backgroundColor: 'rgba(255,128,128,0.08)', border: '1px solid rgba(255,128,128,0.2)' }}>
                {uploadError}
              </p>
            )}
            {uploadSuccess && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#4ADE80', backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                Imagen subida correctamente
              </p>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="py-3 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: file && !uploading ? '#C9A96E' : 'rgba(201,169,110,0.15)',
                color: file && !uploading ? '#0E0B08' : '#4A4540',
                cursor: file && !uploading ? 'pointer' : 'not-allowed',
              }}
            >
              {uploading ? 'Subiendo…' : 'Subir imagen'}
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div
              className="relative overflow-hidden rounded-xl flex-shrink-0"
              style={{ width: 140, height: 140, border: '1px solid rgba(201,169,110,0.2)' }}
            >
              <Image src={preview} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Gallery count + grid */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#C9A96E' }}>
          Galería
        </h2>
        <span className="text-xs" style={{ color: '#4A4540' }}>
          {images.length} imagen{images.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {images.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ backgroundColor: '#161310', border: '1px dashed rgba(201,169,110,0.1)' }}
        >
          <p className="text-sm" style={{ color: '#4A4540' }}>No hay imágenes en la galería</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-xl overflow-hidden"
              style={{
                aspectRatio: '4/3',
                border: '1px solid rgba(201,169,110,0.08)',
                backgroundColor: '#161310',
              }}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? 'Galería'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay on hover */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: 'rgba(14,11,8,0.75)' }}
              >
                <button
                  onClick={() => setDeleteTarget(img)}
                  className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: 'rgba(255,80,80,0.15)',
                    color: '#FF8080',
                    border: '1px solid rgba(255,80,80,0.3)',
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null) } }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar imagen</DialogTitle>
            <DialogDescription>
              ¿Eliminar esta imagen de la galería? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden mx-auto" style={{ border: '1px solid rgba(201,169,110,0.15)' }}>
              <Image src={deleteTarget.url} alt={deleteTarget.alt_text ?? ''} fill className="object-cover" />
            </div>
          )}
          {deleteError && (
            <p className="text-sm text-center" style={{ color: '#FF8080' }}>{deleteError}</p>
          )}
          <DialogFooter>
            <button
              onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
              disabled={deleting}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ color: '#7A7268', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: 'rgba(255,80,80,0.15)', color: '#FF8080', border: '1px solid rgba(255,80,80,0.25)' }}
            >
              {deleting ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
