import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Missing or invalid date' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get all available slots for this date
  const { data: slots } = await supabase
    .from('availability_slots')
    .select('id, start_time, end_time')
    .eq('date', date)
    .eq('is_available', true)
    .order('start_time', { ascending: true })

  if (!slots || slots.length === 0) return NextResponse.json({ slots: [] })

  // Get booked slot times for this date
  const { data: booked } = await supabase
    .from('appointments')
    .select('slot_start_time')
    .eq('slot_date', date)
    .eq('status', 'confirmed')

  const bookedTimes = new Set((booked ?? []).map((b) => b.slot_start_time))
  const available = slots.filter((s) => !bookedTimes.has(s.start_time))

  return NextResponse.json({ slots: available })
}
