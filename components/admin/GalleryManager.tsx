'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { deleteGalleryImage } from '@/actions/gallery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function GalleryManager({ images, onRefresh }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [altText, setAltText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setUploadError(null)
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
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (altText.trim()) formData.append('alt_text', altText.trim())
      formData.append('display_order', String(images.length))

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Upload failed')
      }
      setFile(null)
      setPreview(null)
      setAltText('')
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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 mb-8">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">Subir imagen</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="gallery-file" className="text-zinc-400 text-xs mb-1.5 block">
              Archivo (jpg, png, webp…)
            </Label>
            <Input
              id="gallery-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-zinc-300"
            />
          </div>
          <div>
            <Label htmlFor="gallery-alt" className="text-zinc-400 text-xs mb-1.5 block">
              Texto alternativo (opcional)
            </Label>
            <Input
              id="gallery-alt"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descripción de la imagen"
              className="text-zinc-300"
            />
          </div>
          {preview && (
            <div className="w-32 h-32 rounded-md overflow-hidden border border-zinc-700 relative">
              <Image src={preview} alt="Preview" fill className="object-cover" />
            </div>
          )}
          {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Subiendo…' : 'Subir imagen'}
          </Button>
        </div>
      </div>

      {/* Gallery grid */}
      {images.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">No hay imágenes en la galería</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-lg overflow-hidden border border-zinc-800 aspect-square bg-zinc-900">
              <Image
                src={img.url}
                alt={img.alt_text ?? 'Galería'}
                fill
                className="object-cover"
              />
              <button
                onClick={() => setDeleteTarget(img)}
                className="absolute top-2 right-2 size-7 rounded-full bg-zinc-900/80 hover:bg-red-600 text-zinc-200 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                aria-label="Eliminar imagen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null) } }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar imagen</DialogTitle>
            <DialogDescription>
              ¿Eliminar esta imagen de la galería? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="w-24 h-24 rounded-md overflow-hidden border border-zinc-700 relative mx-auto">
              <Image src={deleteTarget.url} alt={deleteTarget.alt_text ?? ''} fill className="object-cover" />
            </div>
          )}
          {deleteError && <p className="text-sm text-red-400 text-center">{deleteError}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
