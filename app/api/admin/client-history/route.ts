import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'MISSING_PHONE' }, { status: 400 })

  const supabase = await createClient()
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes, status, created_at, cancelled_at, completed_at, rescheduled_at')
    .eq('client_phone', phone)
    .order('slot_date', { ascending: false })

  const appts = appointments ?? []
  const stats = {
    total: appts.length,
    completed: appts.filter(a => a.status === 'completed').length,
    cancelled: appts.filter(a =>
      a.status === 'cancelled' || a.status === 'cancelled_by_client' || a.status === 'cancelled_by_admin'
    ).length,
    noShow: appts.filter(a => a.status === 'no_show').length,
    lastVisit: appts.find(a => a.status === 'completed')?.slot_date ?? null,
  }

  return NextResponse.json({ appointments: appts, stats })
}
