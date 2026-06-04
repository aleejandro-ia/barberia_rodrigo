import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser, isAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Appointment, ClientRecord } from '@/types'

/** Normalize a phone to digits-only so "600 123 456" == "600123456". */
function normPhone(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '')
}

export async function GET() {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const supabase = await createClient()

  // Admin sees ALL appointments via RLS (is_admin() in select policy).
  const { data: apptRaw, error } = await supabase
    .from('appointments')
    .select(
      'id, user_id, slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes, status, created_at, cancelled_at, rescheduled_at, completed_at, barber_id'
    )
    .order('slot_date', { ascending: false })
    .order('slot_start_time', { ascending: false })

  if (error) return NextResponse.json({ error: 'QUERY_FAILED' }, { status: 500 })

  const appts = (apptRaw ?? []) as Appointment[]

  // Enrich registered appointments with the account email (auth.users).
  // Service-role only; degrades gracefully (walk-ins stay null).
  const emailMap = new Map<string, string>()
  try {
    const userIds = Array.from(
      new Set(appts.map((a) => a.user_id).filter((id): id is string => !!id))
    )
    if (userIds.length > 0) {
      const admin = createAdminClient()
      const results = await Promise.all(
        userIds.map(async (id) => {
          const { data, error: e } = await admin.auth.admin.getUserById(id)
          if (e || !data?.user?.email) return null
          return [id, data.user.email] as const
        })
      )
      for (const r of results) if (r) emailMap.set(r[0], r[1])
    }
  } catch (e) {
    console.warn('[admin/clients] email enrichment skipped:', e)
  }

  // ── Group ────────────────────────────────────────────────────
  // Registered clients group by user_id. Walk-ins (no account) group by
  // phone, and fold into a registered client when the phone matches.
  const byKey = new Map<string, ClientRecord>()
  const phoneToRegisteredKey = new Map<string, string>()

  const blank = (
    key: string,
    type: ClientRecord['type'],
    name: string,
    email: string | null,
    phone: string,
  ): ClientRecord => ({
    key,
    type,
    name,
    email,
    phone,
    totalCount: 0,
    completedCount: 0,
    upcomingCount: 0,
    cancelledCount: 0,
    noShowCount: 0,
    rescheduledCount: 0,
    lastVisit: null,
    appointments: [],
  })

  const today = new Date().toISOString().split('T')[0]

  // Pass 1 — registered (appts already sorted newest-first, so the first
  // appointment seen carries the freshest name/phone).
  for (const a of appts) {
    if (!a.user_id) continue
    const key = a.user_id
    if (!byKey.has(key)) {
      byKey.set(key, blank(key, 'registered', a.client_name, emailMap.get(a.user_id) ?? null, a.client_phone))
      const np = normPhone(a.client_phone)
      if (np) phoneToRegisteredKey.set(np, key)
    }
  }

  // Pass 2 — assign every appointment to a client record.
  for (const a of appts) {
    let key: string
    if (a.user_id) {
      key = a.user_id
    } else {
      const np = normPhone(a.client_phone)
      const matched = np ? phoneToRegisteredKey.get(np) : undefined
      if (matched) {
        key = matched
      } else {
        key = `phone:${np || a.id}`
        if (!byKey.has(key)) {
          byKey.set(key, blank(key, 'walkin', a.client_name, null, a.client_phone))
        }
      }
    }

    const rec = byKey.get(key)!
    rec.appointments.push(a)
    rec.totalCount++
    if (a.status === 'completed') rec.completedCount++
    else if (a.status === 'confirmed' && a.slot_date >= today) rec.upcomingCount++
    else if (a.status === 'no_show') rec.noShowCount++
    else if (a.status === 'rescheduled') rec.rescheduledCount++
    else if (
      a.status === 'cancelled' ||
      a.status === 'cancelled_by_client' ||
      a.status === 'cancelled_by_admin'
    )
      rec.cancelledCount++

    if (!rec.lastVisit || a.slot_date > rec.lastVisit) rec.lastVisit = a.slot_date
  }

  const clients = Array.from(byKey.values()).sort((x, y) => {
    if (x.lastVisit && y.lastVisit) return x.lastVisit < y.lastVisit ? 1 : -1
    if (x.lastVisit) return -1
    if (y.lastVisit) return 1
    return 0
  })

  return NextResponse.json({ clients })
}
