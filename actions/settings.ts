'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type SectionKey = 'gallery_enabled' | 'before_after_enabled'

export async function toggleSection(key: SectionKey, enabled: boolean) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key,
        image_url:  enabled ? 'true' : 'false',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )

  if (error) return { error: 'DB_ERROR' as const }

  revalidatePath('/')
  return { success: true as const }
}
