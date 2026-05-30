'use client'

import { useEffect, useState } from 'react'
import GalleryManager from '@/components/admin/GalleryManager'
import type { GalleryImage } from '@/types'

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchImages() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gallery')
      if (!res.ok) throw new Error('Error cargando galería')
      const data = await res.json()
      setImages(data.images ?? [])
    } catch {
      setError('Error al cargar la galería')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6">Galería</h1>
      {loading ? (
        <div className="text-center py-16 text-zinc-500">Cargando…</div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : (
        <GalleryManager images={images} onRefresh={fetchImages} />
      )}
    </div>
  )
}
