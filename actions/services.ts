'use server'
import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

function revalidateServices() {
  revalidatePath('/admin/services')
  revalidatePath('/api/services')
}

export async function adminCreateService(data: {
  name: string
  price_eur: number
  duration_minutes?: number
  display_order?: number
}) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }
  if (!data.name?.trim()) return { error: 'VALIDATION_ERROR' as const }

  const supabase = await createClient()
  const { data: service, error } = await supabase
    .from('services')
    .insert({
      name: data.name.trim(),
      price_eur: data.price_eur,
      duration_minutes: data.duration_minutes ?? 30,
      display_order: data.display_order ?? 0,
      is_active: true,
    })
    .select()
    .single()

  if (error || !service) return { error: 'VALIDATION_ERROR' as const }
  revalidateServices()
  return { service }
}

export async function adminUpdateService(
  id: string,
  data: Partial<{
    name: string
    price_eur: number
    duration_minutes: number
    display_order: number
    is_active: boolean
  }>
) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: service, error } = await supabase
    .from('services')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error || !service) return { error: 'NOT_FOUND' as const }
  revalidateServices()
  return { service }
}

export async function adminDeleteService(id: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { error: 'NOT_FOUND' as const }
  revalidateServices()
  return { success: true as const }
}
