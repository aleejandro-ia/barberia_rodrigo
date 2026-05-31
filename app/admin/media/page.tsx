'use client'

import { useEffect, useState } from 'react'
import GalleryManager from '@/components/admin/GalleryManager'
import BeforeAfterManager from '@/components/admin/BeforeAfterManager'
import SettingsManager from '@/components/admin/SettingsManager'
import type { GalleryImage } from '@/types'

type Tab = 'gallery' | 'before-after' | 'images'

interface Settings {
  hero_image:           string | null
  about_portrait:       string | null
  gallery_enabled:      boolean
  before_after_enabled: boolean
}

interface BeforeAfterItem {
  id: string
  before_url: string
  after_url: string
  description: string | null
  display_order: number
}

export default function AdminMediaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('gallery')

  // Gallery state
  const [images,        setImages]        = useState<GalleryImage[]>([])
  const [galleryLoading,setGalleryLoading]= useState(false)
  const [galleryError,  setGalleryError]  = useState<string | null>(null)

  // Before/After state
  const [items,     setItems]     = useState<BeforeAfterItem[]>([])
  const [baLoading, setBaLoading] = useState(false)
  const [baError,   setBaError]   = useState<string | null>(null)

  // Settings/Images state
  const [settings,        setSettings]        = useState<Settings>({
    hero_image:           null,
    about_portrait:       null,
    gallery_enabled:      true,
    before_after_enabled: true,
  })
  const [settingsLoading, setSettingsLoading] = useState(false)

  async function fetchGallery() {
    setGalleryLoading(true)
    setGalleryError(null)
    try {
      const res  = await fetch('/api/gallery')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setImages(data.images ?? [])
    } catch {
      setGalleryError('Error al cargar la galería')
    } finally {
      setGalleryLoading(false)
    }
  }

  async function fetchBeforeAfter() {
    setBaLoading(true)
    setBaError(null)
    try {
      const res  = await fetch('/api/before-after')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      setBaError('Error al cargar transformaciones')
    } finally {
      setBaLoading(false)
    }
  }

  async function fetchSettings() {
    setSettingsLoading(true)
    try {
      const res  = await fetch('/api/settings')
      const data = await res.json()
      const s    = data.settings ?? {}
      setSettings({
        hero_image:           s.hero_image           ?? null,
        about_portrait:       s.about_portrait       ?? null,
        gallery_enabled:      s.gallery_enabled      !== 'false',
        before_after_enabled: s.before_after_enabled !== 'false',
      })
    } catch {
      // silently fail
    } finally {
      setSettingsLoading(false)
    }
  }

  // Lazy-load data when switching tabs
  useEffect(() => {
    if (activeTab === 'gallery' && images.length === 0 && !galleryLoading) {
      fetchGallery()
    }
    if (activeTab === 'before-after' && items.length === 0 && !baLoading) {
      fetchBeforeAfter()
    }
    if (activeTab === 'images' && !settingsLoading && settings.hero_image === null) {
      fetchSettings()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'gallery',      label: 'Galería' },
    { key: 'before-after', label: 'Antes / Después' },
    { key: 'images',       label: 'Imágenes del sitio' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Media
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A7268' }}>
          Galería, transformaciones e imágenes del sitio.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-8 overflow-x-auto"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
              style={{
                color:           isActive ? '#C9A96E' : '#7A7268',
                backgroundColor: isActive ? 'rgba(201,169,110,0.1)' : 'transparent',
                border:          isActive ? '1px solid rgba(201,169,110,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'gallery' && (
        galleryLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
          </div>
        ) : galleryError ? (
          <div className="text-center py-16 text-sm" style={{ color: '#FF8080' }}>{galleryError}</div>
        ) : (
          <GalleryManager images={images} onRefresh={fetchGallery} />
        )
      )}

      {activeTab === 'before-after' && (
        baLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
          </div>
        ) : baError ? (
          <div className="text-center py-16 text-sm" style={{ color: '#FF8080' }}>{baError}</div>
        ) : (
          <BeforeAfterManager items={items} onRefresh={fetchBeforeAfter} />
        )
      )}

      {activeTab === 'images' && (
        settingsLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
          </div>
        ) : (
          <SettingsManager settings={settings} onRefresh={fetchSettings} />
        )
      )}
    </div>
  )
}
