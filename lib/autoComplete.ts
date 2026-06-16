import type { SupabaseClient } from '@supabase/supabase-js'
import { madridTimeToMs } from '@/lib/datetime'

/**
 * Auto-mark past confirmed appointments as 'completed'.
 *
 * Rule: a 'confirmed' appointment whose END time (Europe/Madrid wall-clock)
 * is already in the past is assumed attended → flipped to 'completed'.
 * No-shows are the exception and stay a manual admin override.
 *
 * Requires a SERVICE-ROLE client (bypasses RLS). Idempotent and best-effort —
 * callers should wrap in try/catch so a failure never blocks the response.
 *
 * Returns the number of appointments updated.
 */
export async function autoCompletePastAppointments(admin: SupabaseClient): Promise<number> {
  const todayStr = new Date().toISOString().split('T')[0]

  const { data } = await admin
    .from('appointments')
    .select('id, slot_date, slot_end_time')
    .eq('status', 'confirmed')
    .lte('slot_date', todayStr)

  const now = Date.now()
  const ids = (data ?? [])
    .filter((a) => madridTimeToMs(a.slot_date, a.slot_end_time) < now)
    .map((a) => a.id as string)

  if (ids.length === 0) return 0

  await admin
    .from('appointments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .in('id', ids)

  return ids.length
}

// ── Throttled variant for lazy admin reads ──────────────────────────
// Admin GETs (agenda, clients) used to run a full auto-complete scan on EVERY
// request. The redesigned schedule designer refetches the agenda on every date
// selection, so that was firing many redundant scans per minute. The daily cron
// (/api/cron/reminders) is the authoritative pass; this lazy variant is only a
// best-effort safety net, so collapsing it to at most once per instance per
// THROTTLE_MS keeps the net while killing the hammering. In-memory state is
// per-instance — fine for a backstop, no correctness dependency.
const THROTTLE_MS = 5 * 60 * 1000
let lastRun = 0

export async function autoCompletePastAppointmentsThrottled(
  admin: SupabaseClient,
): Promise<number> {
  const now = Date.now()
  if (now - lastRun < THROTTLE_MS) return 0
  lastRun = now
  return autoCompletePastAppointments(admin)
}
