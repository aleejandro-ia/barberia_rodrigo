import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, slot_date, slot_start_time, slot_end_time,
      client_name, client_phone, notes, status, created_at,
      cancelled_at, cancellation_reason, rescheduled_at,
      previous_slot_date, previous_slot_start_time, completed_at,
      reminder_24h_sent_at, reminder_2h_sent_at, barber_id
    `)
    .eq('user_id', user.id)
    .order('slot_date', { ascending: true })
    .order('slot_start_time', { ascending: true })

  return NextResponse.json({ appointments: appointments ?? [] })
}
