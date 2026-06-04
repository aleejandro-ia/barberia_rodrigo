'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function updateMyProfile(data: unknown): Promise<
  | { success: true }
  | { error: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'UPDATE_FAILED' }
> {
  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) return { error: 'VALIDATION_ERROR' as const }

  const user = await getUser()
  if (!user) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { full_name, phone } = parsed.data

  // RLS (profiles_update_own) guarantees the user can only touch their own row.
  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id)
    .select('id')

  if (error || !updated || updated.length === 0) {
    return { error: 'UPDATE_FAILED' as const }
  }

  revalidatePath('/mis-citas')
  revalidatePath('/')
  return { success: true as const }
}
