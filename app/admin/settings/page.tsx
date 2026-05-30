'use client'

import { useEffect, useState } from 'react'
import SettingsManager from '@/components/admin/SettingsManager'

interface Settings {
  hero_image: string | null
  about_portrait: string | null
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({ hero_image: null, about_portrait: null })
  const [loading, setLoading] = useState(true)

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings({
        hero_image: data.settings?.hero_image ?? null,
        about_portrait: data.settings?.about_portrait ?? null,
      })
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Imágenes del sitio
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A7268' }}>
          Sube la foto del hero y el retrato de Rodrigo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
        </div>
      ) : (
        <SettingsManager settings={settings} onRefresh={fetchSettings} />
      )}
    </div>
  )
}
