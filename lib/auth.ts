import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Admin identity has TWO sources of truth that MUST stay in sync:
//   1. App layer  — this function + proxy.ts compare against process.env.ADMIN_EMAIL
//   2. DB layer   — RLS policies call public.is_admin(), which reads the admin
//                   email from a Postgres setting (app.settings.admin_email)
// If these diverge, the app guard and the DB RLS disagree: the panel may load
// but every query returns empty, or vice versa. When changing the admin email,
// update BOTH. Comparison is case-sensitive on purpose — Supabase stores emails
// lowercased, so ADMIN_EMAIL must be the exact lowercase address.
export function isAdmin(user: User | null): boolean {
  if (!user) return false
  return user.email === process.env.ADMIN_EMAIL
}
