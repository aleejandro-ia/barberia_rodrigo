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
