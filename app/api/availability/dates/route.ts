import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Missing or invalid month' }, { status: 400 })
  }

  const barber_id = request.nextUrl.searchParams.get('barber_id')

  const supabase = await createClient()
  const startDate = `${month}-01`
  const [year, mon] = month.split('-').map(Number)
  const nextMonth =
    mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, '0')}-01`
  const today = new Date().toISOString().split('T')[0]

  // Fetch available slots WITH start_time so we can check per-slot availability
  let slotsQuery = supabase
    .from('availability_slots')
    .select('date, start_time')
    .eq('is_available', true)
    .gte('date', startDate < today ? today : startDate)
    .lt('date', nextMonth)

  // Each barber has their own slots — filter strictly by barber_id
  if (barber_id) slotsQuery = slotsQuery.eq('barber_id', barber_id)

  const { data: slots } = await slotsQuery

  if (!slots || slots.length === 0) return NextResponse.json({ dates: [] })

  const potentialDates = [...new Set(slots.map((s) => s.date))]

  // Fetch confirmed bookings — use service role so ALL confirmed appointments
  // are visible regardless of who's calling (RLS hides other users' bookings
  // from non-admin sessions, causing fully-booked dates to still appear available)
  const adminClient = createAdminClient()
  const { data: booked } = await adminClient
    .from('appointments')
    .select('slot_date, slot_start_time')
    .eq('status', 'confirmed')
    .in('slot_date', potentialDates)

  const bookedMap: Record<string, Set<string>> = {}
  for (const b of booked ?? []) {
    if (!bookedMap[b.slot_date]) bookedMap[b.slot_date] = new Set()
    bookedMap[b.slot_date].add(b.slot_start_time)
  }

  // Only return dates that have at least one slot NOT yet booked
  const dates = potentialDates
    .filter((date) => {
      const timesForDate = slots
        .filter((s) => s.date === date)
        .map((s) => s.start_time)
      const bookedTimes = bookedMap[date] ?? new Set<string>()
      return timesForDate.some((t) => !bookedTimes.has(t))
    })
    .sort()

  return NextResponse.json({ dates })
}
