import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import type { AgendaDay, AgendaSlot, AvailabilitySlot, Appointment } from '@/types'

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 })

  // Validate date format
  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRe.test(from) || !dateRe.test(to)) {
    return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 })
  }

  // Max 14 days
  const fromMs = new Date(from).getTime()
  const toMs   = new Date(to).getTime()
  if (toMs - fromMs > 31 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'RANGE_TOO_LARGE' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch ALL slots (including blocked/unavailable) for admin view
  const { data: slotsRaw } = await supabase
    .from('availability_slots')
    .select('id, date, start_time, end_time, is_available, blocked_reason, updated_at, created_at')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  // Fetch all appointments (confirmed + cancelled) in range
  const { data: apptRaw } = await supabase
    .from('appointments')
    .select('id, user_id, slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes, status, created_at, barber_id')
    .gte('slot_date', from)
    .lte('slot_date', to)
    .order('slot_date', { ascending: true })
    .order('slot_start_time', { ascending: true })

  const slots = (slotsRaw ?? []) as AvailabilitySlot[]
  const appts = (apptRaw ?? []) as Appointment[]

  // Build a lookup: "date|start_time" → appointments[]
  const apptMap = new Map<string, Appointment[]>()
  for (const a of appts) {
    const key = `${a.slot_date}|${a.slot_start_time.slice(0, 5)}`
    if (!apptMap.has(key)) apptMap.set(key, [])
    apptMap.get(key)!.push(a)
  }

  // Join: each slot gets its best appointment (confirmed > cancelled > null)
  const agendaSlots: AgendaSlot[] = slots.map((slot) => {
    const key = `${slot.date}|${slot.start_time.slice(0, 5)}`
    const candidates = apptMap.get(key) ?? []
    const confirmed  = candidates.find((a) => a.status === 'confirmed') ?? null
    const cancelled  = candidates.find((a) => a.status === 'cancelled') ?? null
    return { slot, appointment: confirmed ?? cancelled }
  })

  // Group by date into AgendaDay[]
  const dayMap = new Map<string, AgendaSlot[]>()
  for (const as of agendaSlots) {
    const d = as.slot.date
    if (!dayMap.has(d)) dayMap.set(d, [])
    dayMap.get(d)!.push(as)
  }

  const days: AgendaDay[] = Array.from(dayMap.entries()).map(([date, dSlots]) => {
    let confirmedCount = 0
    let blockedCount   = 0
    let freeCount      = 0
    for (const s of dSlots) {
      if (!s.slot.is_available)                               blockedCount++
      else if (s.appointment?.status === 'confirmed')         confirmedCount++
      else                                                     freeCount++
    }
    return {
      date,
      slots: dSlots,
      totalSlots: dSlots.length,
      confirmedCount,
      blockedCount,
      freeCount,
    }
  })

  return NextResponse.json({ days })
}
