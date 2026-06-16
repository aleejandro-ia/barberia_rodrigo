import type { SupabaseClient } from '@supabase/supabase-js'

// Appointment emails live in auth.users (not profiles), reachable only via the
// Auth Admin API with a service-role client. Both /api/admin/agenda and
// /api/admin/clients enriched appointments by calling getUserById once PER user
// on EVERY request (N+1). Since the schedule designer refetches the agenda on
// each date pick, the same handful of users were looked up over and over.
//
// This shared helper adds a small per-instance cache (TTL): a user's email is
// effectively immutable for our purposes, so caching it cuts the repeated
// round-trips without changing behaviour. Degrades gracefully — any lookup
// failure simply leaves that user unmapped (walk-ins have no account anyway).

const TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { email: string | null; at: number }>()

/**
 * Resolve account emails for the given user ids.
 * Returns a Map of userId → email for every id that has one.
 */
export async function getUserEmails(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const now = Date.now()
  const misses: string[] = []

  // Dedupe + serve fresh cache hits.
  for (const id of new Set(userIds)) {
    const hit = cache.get(id)
    if (hit && now - hit.at < TTL_MS) {
      if (hit.email) out.set(id, hit.email)
    } else {
      misses.push(id)
    }
  }

  if (misses.length === 0) return out

  const results = await Promise.all(
    misses.map(async (id) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(id)
        if (error || !data?.user?.email) return [id, null] as const
        return [id, data.user.email] as const
      } catch {
        return [id, null] as const
      }
    }),
  )

  for (const [id, email] of results) {
    cache.set(id, { email, at: now })
    if (email) out.set(id, email)
  }

  return out
}
