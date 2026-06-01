import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client — bypasses RLS.
 * Use ONLY for read-only ops that need global visibility
 * (e.g. checking all confirmed appointments for availability).
 * Never use for user-triggered mutations.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('[createAdminClient] SUPABASE_SERVICE_ROLE_KEY not set')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
