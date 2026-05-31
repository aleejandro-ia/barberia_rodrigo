import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Week boundaries (Mon-Sun)
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Mon=0
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  // Next 7 days
  const next7 = new Date(now)
  next7.setDate(now.getDate() + 7)
  const next7Str = next7.toISOString().split('T')[0]

  // Last 30 days
  const last30 = new Date(now)
  last30.setDate(now.getDate() - 30)
  const last30Str = last30.toISOString().split('T')[0]

  const [
    { data: todayAppts },
    { data: weekAppts },
    { data: upcomingAppts },
    { data: freeSlots },
    { data: last30Appts },
    { data: last30Slots },
    { data: topClientsRaw },
  ] = await Promise.all([
    supabase.from('appointments').select('status').eq('slot_date', today),
    supabase.from('appointments').select('status').gte('slot_date', weekStartStr).lte('slot_date', weekEndStr),
    supabase.from('appointments').select('id').eq('status', 'confirmed').gt('slot_date', today).lte('slot_date', next7Str),
    supabase.from('availability_slots').select('id').eq('is_available', true).gt('date', today).lte('date', next7Str),
    supabase.from('appointments').select('status').gte('slot_date', last30Str).lte('slot_date', today),
    supabase.from('availability_slots').select('id').gte('date', last30Str).lte('date', today),
    supabase.from('appointments').select('client_name, client_phone').eq('status', 'completed').gte('slot_date', last30Str),
  ])

  const todayList  = todayAppts  ?? []
  const weekList   = weekAppts   ?? []
  const last30List = last30Appts ?? []

  const confirmed30  = last30List.filter(a => a.status === 'confirmed' || a.status === 'completed').length
  const totalSlots30 = (last30Slots ?? []).length
  const occupancyRate = totalSlots30 > 0 ? Math.round((confirmed30 / totalSlots30) * 100) : 0

  // Top clients by phone
  const phoneCount: Record<string, { name: string; phone: string; count: number }> = {}
  for (const a of topClientsRaw ?? []) {
    if (!phoneCount[a.client_phone]) {
      phoneCount[a.client_phone] = { name: a.client_name, phone: a.client_phone, count: 0 }
    }
    phoneCount[a.client_phone].count++
  }
  const topClients = Object.values(phoneCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return NextResponse.json({
    today: {
      confirmed: todayList.filter(a => a.status === 'confirmed').length,
      completed: todayList.filter(a => a.status === 'completed').length,
      noShow:    todayList.filter(a => a.status === 'no_show').length,
    },
    thisWeek: {
      confirmed: weekList.filter(a => a.status === 'confirmed').length,
      completed: weekList.filter(a => a.status === 'completed').length,
      cancelled: weekList.filter(a => ['cancelled','cancelled_by_client','cancelled_by_admin'].includes(a.status)).length,
      noShow:    weekList.filter(a => a.status === 'no_show').length,
    },
    upcoming7days: (upcomingAppts ?? []).length,
    freeSlots7days: (freeSlots ?? []).length,
    occupancyRate,
    topClients,
  })
}
