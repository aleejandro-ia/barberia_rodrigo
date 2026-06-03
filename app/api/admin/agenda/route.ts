import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser, isAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import type { AgendaDay, AgendaSlot, AvailabilitySlot, Appointment } from '@/types'

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const from      = searchParams.get('from')
  const to        = searchParams.get('to')
  const barber_id = searchParams.get('barber_id')

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
  let slotsQuery = supabase
    .from('availability_slots')
    .select('id, date, start_time, end_time, is_available, blocked_reason, updated_at, created_at, barber_id')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (barber_id) slotsQuery = slotsQuery.eq('barber_id', barber_id)

  const { data: slotsRaw } = await slotsQuery

  // Fetch appointments scoped to same barber — prevents cross-barber bleed
  let apptsQuery = supabase
    .from('appointments')
    .select('id, user_id, slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes, status, created_at, barber_id')
    .gte('slot_date', from)
    .lte('slot_date', to)
    .order('slot_date', { ascending: true })
    .order('slot_start_time', { ascending: true })

  if (barber_id) apptsQuery = apptsQuery.eq('barber_id', barber_id)

  const { data: apptRaw } = await apptsQuery

  const slots = (slotsRaw ?? []) as AvailabilitySlot[]
  const appts = (apptRaw ?? []) as Appointment[]

  // Enrich appointments with the email of the account that booked them.
  // Email lives in auth.users (not profiles) → needs service-role client.
  // Degrades gracefully: on any failure, emails stay null (walk-ins have no account).
  try {
    const userIds = Array.from(
      new Set(appts.map((a) => a.user_id).filter((id): id is string => !!id))
    )
    if (userIds.length > 0) {
      const admin = createAdminClient()
      const { data: profilesWithEmail } = await admin
        .schema('auth')
        .from('users')
        .select('id, email')
        .in('id', userIds)
      const emailMap = new Map<string, string>()
      for (const u of profilesWithEmail ?? []) {
        if (u.email) emailMap.set(u.id as string, u.email as string)
      }
      for (const a of appts) {
        if (a.user_id) a.client_email = emailMap.get(a.user_id) ?? null
      }
    }
  } catch (e) {
    console.warn('[admin/agenda] email enrichment skipped:', e)
  }

  // Build a lookup: "date|start_time|barber_id" → appointments[]
  // barber_id in key prevents a slot from one barber picking up another barber's appointment
  const apptMap = new Map<string, Appointment[]>()
  for (const a of appts) {
    const key = `${a.slot_date}|${a.slot_start_time.slice(0, 5)}|${a.barber_id ?? ''}`
    if (!apptMap.has(key)) apptMap.set(key, [])
    apptMap.get(key)!.push(a)
  }

  // Join: each slot gets its most relevant appointment.
  // Priority: confirmed (active) > completed > no_show (terminal history worth showing).
  // Cancelled variants are intentionally NOT surfaced so the slot stays free/rebookable.
  const agendaSlots: AgendaSlot[] = slots.map((slot) => {
    const key = `${slot.date}|${slot.start_time.slice(0, 5)}|${slot.barber_id ?? ''}`
    const candidates = apptMap.get(key) ?? []
    const confirmed  = candidates.find((a) => a.status === 'confirmed') ?? null
    const completed  = candidates.find((a) => a.status === 'completed') ?? null
    const noShow     = candidates.find((a) => a.status === 'no_show') ?? null
    return { slot, appointment: confirmed ?? completed ?? noShow }
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
      else if (!s.appointment)                                freeCount++
      // completed / no_show: surfaced but neither free nor confirmed
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
