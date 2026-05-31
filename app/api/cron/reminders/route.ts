import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/email/resend'

export async function GET(req: Request) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Need service role to fetch user emails
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('[cron/reminders] SUPABASE_SERVICE_ROLE_KEY not set — skipping')
    return NextResponse.json({ processed24h: 0, processed2h: 0 })
  }

  const supabase = await createClient()

  // Read reminder settings
  const { data: settingsRows } = await supabase
    .from('booking_settings')
    .select('key, value')
    .in('key', ['reminders_enabled', 'reminder_24h_enabled', 'reminder_2h_enabled', 'business_name'])

  const s: Record<string, string> = {}
  for (const row of settingsRows ?? []) s[row.key] = row.value

  if ((s.reminders_enabled ?? 'true') === 'false') {
    return NextResponse.json({ processed24h: 0, processed2h: 0 })
  }

  const businessName = s.business_name ?? 'BG Barber'

  // Admin client (service role) for auth.users
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const now = new Date()

  // ─── 24h window ──────────────────────────────────────────────
  let processed24h = 0
  if ((s.reminder_24h_enabled ?? 'true') === 'true') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: appts24h } = await supabase
      .from('appointments')
      .select('id, user_id, client_name, slot_date, slot_start_time, slot_end_time, notes')
      .eq('status', 'confirmed')
      .eq('slot_date', tomorrowStr)
      .is('reminder_24h_sent_at', null)
      .not('user_id', 'is', null)

    for (const appt of appts24h ?? []) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appt.user_id!)
        if (!user?.email) continue

        await sendReminderEmail({
          to: user.email,
          name: appt.client_name,
          date: appt.slot_date,
          time: appt.slot_start_time.slice(0, 5),
          service: appt.notes ?? undefined,
          business: businessName,
        }, '24h')

        await supabase
          .from('appointments')
          .update({ reminder_24h_sent_at: new Date().toISOString() })
          .eq('id', appt.id)

        processed24h++
      } catch (e) {
        console.error('[cron/reminders] 24h error for', appt.id, e)
      }
    }
  }

  // ─── 2h window ───────────────────────────────────────────────
  let processed2h = 0
  if ((s.reminder_2h_enabled ?? 'true') === 'true') {
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const in2hDate = in2h.toISOString().split('T')[0]
    const in2hTime = in2h.toTimeString().slice(0, 5)
    const nowTime  = now.toTimeString().slice(0, 5)

    const { data: appts2h } = await supabase
      .from('appointments')
      .select('id, user_id, client_name, slot_date, slot_start_time, slot_end_time, notes')
      .eq('status', 'confirmed')
      .eq('slot_date', in2hDate)
      .gte('slot_start_time', nowTime)
      .lte('slot_start_time', in2hTime)
      .is('reminder_2h_sent_at', null)
      .not('user_id', 'is', null)

    for (const appt of appts2h ?? []) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appt.user_id!)
        if (!user?.email) continue

        await sendReminderEmail({
          to: user.email,
          name: appt.client_name,
          date: appt.slot_date,
          time: appt.slot_start_time.slice(0, 5),
          service: appt.notes ?? undefined,
          business: businessName,
        }, '2h')

        await supabase
          .from('appointments')
          .update({ reminder_2h_sent_at: new Date().toISOString() })
          .eq('id', appt.id)

        processed2h++
      } catch (e) {
        console.error('[cron/reminders] 2h error for', appt.id, e)
      }
    }
  }

  return NextResponse.json({ processed24h, processed2h })
}
