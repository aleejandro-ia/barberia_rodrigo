import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false
  return user.email === process.env.ADMIN_EMAIL
}
