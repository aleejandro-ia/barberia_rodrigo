import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Missing or invalid date' }, { status: 400 })
  }

  const barber_id = request.nextUrl.searchParams.get('barber_id')

  const supabase = await createClient()

  // Get all available slots for this date
  let query = supabase
    .from('availability_slots')
    .select('id, start_time, end_time')
    .eq('date', date)
    .eq('is_available', true)
    .order('start_time', { ascending: true })

  // Each barber has their own slots — filter strictly by barber_id
  if (barber_id) query = query.eq('barber_id', barber_id)

  const { data: slots } = await query

  if (!slots || slots.length === 0) return NextResponse.json({ slots: [] })

  // Get booked slot times — use service role so ALL confirmed appointments
  // are visible regardless of who's calling (RLS hides other users' bookings
  // from non-admin sessions, causing taken slots to appear free)
  const adminClient = createAdminClient()
  const { data: booked } = await adminClient
    .from('appointments')
    .select('slot_start_time')
    .eq('slot_date', date)
    .eq('status', 'confirmed')

  const bookedTimes = new Set((booked ?? []).map((b) => b.slot_start_time))
  const available = slots.filter((s) => !bookedTimes.has(s.start_time))

  return NextResponse.json({ slots: available })
}
