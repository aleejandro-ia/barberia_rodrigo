import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check env vars server-side — return booleans only, never expose actual values
  const resend      = !!process.env.RESEND_API_KEY
  const cron        = !!process.env.CRON_SECRET
  const serviceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  // Read booking settings
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('booking_settings')
    .select('key, value')
    .in('key', ['bookings_enabled', 'reminders_enabled'])

  const m: Record<string, string> = {}
  for (const row of settings ?? []) m[row.key] = row.value

  return NextResponse.json({
    resend,
    cron,
    serviceRole,
    bookingsEnabled:  (m.bookings_enabled  ?? 'true') === 'true',
    remindersEnabled: (m.reminders_enabled ?? 'true') === 'true',
  })
}
