'use client'

import { useEffect, useState } from 'react'
import SettingsManager from '@/components/admin/SettingsManager'

interface Settings {
  hero_image:           string | null
  about_portrait:       string | null
  gallery_enabled:      boolean
  before_after_enabled: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    hero_image:           null,
    about_portrait:       null,
    gallery_enabled:      true,
    before_after_enabled: true,
  })
  const [loading, setLoading] = useState(true)

  async function fetchSettings() {
    setLoading(true)
    try {
      const res  = await fetch('/api/settings')
      const data = await res.json()
      const s    = data.settings ?? {}
      setSettings({
        hero_image:           s.hero_image        ?? null,
        about_portrait:       s.about_portrait    ?? null,
        gallery_enabled:      s.gallery_enabled      !== 'false',
        before_after_enabled: s.before_after_enabled !== 'false',
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
          Ajustes del sitio
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A7268' }}>
          Imágenes y visibilidad de secciones.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
        </div>
      ) : (
        <SettingsManager settings={settings} onRefresh={fetchSettings} />
      )}
    </div>
  )
}
