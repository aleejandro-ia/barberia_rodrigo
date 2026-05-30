'use client'

import { useEffect, useState } from 'react'
import BeforeAfterManager from '@/components/admin/BeforeAfterManager'

interface Item {
  id: string
  before_url: string
  after_url: string
  description: string | null
  display_order: number
}

export default function AdminBeforeAfterPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchItems() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/before-after')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      setError('Error al cargar transformaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Antes &amp; Después
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-sm" style={{ color: '#FF8080' }}>{error}</div>
      ) : (
        <BeforeAfterManager items={items} onRefresh={fetchItems} />
      )}
    </div>
  )
}
