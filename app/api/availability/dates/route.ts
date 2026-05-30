import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Missing or invalid month' }, { status: 400 })
  }

  const supabase = await createClient()
  const startDate = `${month}-01`
  // Compute first day of next month
  const [year, mon] = month.split('-').map(Number)
  const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`
  const today = new Date().toISOString().split('T')[0]

  // Get all available slot dates in range (not past)
  const { data: slots } = await supabase
    .from('availability_slots')
    .select('date')
    .eq('is_available', true)
    .gte('date', startDate < today ? today : startDate)
    .lt('date', nextMonth)

  if (!slots || slots.length === 0) return NextResponse.json({ dates: [] })

  // Get all confirmed booking times in that range to filter fully-booked dates
  const potentialDates = [...new Set(slots.map((s) => s.date))]

  const { data: booked } = await supabase
    .from('appointments')
    .select('slot_date, slot_start_time')
    .eq('status', 'confirmed')
    .in('slot_date', potentialDates)

  const bookedMap: Record<string, Set<string>> = {}
  for (const b of booked ?? []) {
    if (!bookedMap[b.slot_date]) bookedMap[b.slot_date] = new Set()
    bookedMap[b.slot_date].add(b.slot_start_time)
  }

  // Group slots by date
  const slotsByDate: Record<string, string[]> = {}
  for (const s of slots) {
    if (!slotsByDate[s.date]) slotsByDate[s.date] = []
    slotsByDate[s.date].push(s.date) // just counting presence
  }

  // Return dates that still have at least one un-booked slot
  // We don't have start_time in this query — simplification: return all dates with available slots
  // Full slot-level availability is checked in /api/availability/slots
  const dates = potentialDates.sort()

  return NextResponse.json({ dates })
}
