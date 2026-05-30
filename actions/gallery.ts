'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteGalleryImage(imageId: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: image } = await supabase
    .from('gallery_images')
    .select('storage_path')
    .eq('id', imageId)
    .maybeSingle()
  if (!image) return { error: 'NOT_FOUND' as const }

  // Delete from storage first
  await supabase.storage.from('gallery').remove([image.storage_path])
  // Delete DB record
  await supabase.from('gallery_images').delete().eq('id', imageId)

  revalidatePath('/')
  revalidatePath('/admin/gallery')
  return { success: true as const }
}

export async function reorderGalleryImages(orderedIds: string[]) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: 'VALIDATION_ERROR' as const }
  }

  const supabase = await createClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('gallery_images').update({ display_order: index }).eq('id', id)
    )
  )

  revalidatePath('/')
  revalidatePath('/admin/gallery')
  return { success: true as const }
}
