'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { Barber } from '@/types'

function revalidateBarbers() {
  revalidatePath('/admin/ajustes')
  revalidatePath('/api/barbers')
}

export async function createBarber(data: {
  name: string
  title: string
  display_order?: number
}): Promise<{ barber: Barber } | { error: string }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }
  if (!data.name?.trim()) return { error: 'VALIDATION_ERROR' }
  if (!data.title?.trim()) return { error: 'VALIDATION_ERROR' }

  const supabase = await createClient()
  const { data: barber, error } = await supabase
    .from('barbers')
    .insert({
      name: data.name.trim(),
      title: data.title.trim(),
      display_order: data.display_order ?? 0,
      is_active: true,
    })
    .select('id, name, title, photo_url, is_active, display_order, created_at')
    .single()

  if (error || !barber) return { error: 'INSERT_FAILED' }
  revalidateBarbers()
  return { barber }
}

export async function updateBarber(
  id: string,
  data: Partial<{
    name: string
    title: string
    photo_url: string | null
    is_active: boolean
    display_order: number
  }>
): Promise<{ barber: Barber } | { error: string }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()
  const { data: barber, error } = await supabase
    .from('barbers')
    .update(data)
    .eq('id', id)
    .select('id, name, title, photo_url, is_active, display_order, created_at')
    .single()

  if (error || !barber) return { error: 'NOT_FOUND' }
  revalidateBarbers()
  return { barber }
}

export async function deleteBarber(id: string): Promise<{ success: true } | { error: string }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()

  // Check no appointments reference this barber
  const { data: refs, error: refError } = await supabase
    .from('appointments')
    .select('id')
    .eq('barber_id', id)
    .limit(1)

  if (refError) return { error: 'QUERY_FAILED' }
  if (refs && refs.length > 0) return { error: 'BARBER_HAS_APPOINTMENTS' }

  const { error } = await supabase.from('barbers').delete().eq('id', id)
  if (error) return { error: 'DELETE_FAILED' }

  revalidateBarbers()
  return { success: true }
}

export async function reorderBarbers(
  orderedIds: string[]
): Promise<{ success: true } | { error: string }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { error: 'VALIDATION_ERROR' }

  const supabase = await createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('barbers')
      .update({ display_order: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: 'REORDER_FAILED' }

  revalidateBarbers()
  return { success: true }
}
