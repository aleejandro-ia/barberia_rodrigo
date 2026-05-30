import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const date = request.nextUrl.searchParams.get('date')

  let query = supabase
    .from('appointments')
    .select(
      'id, slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes, status, created_at'
    )
    .order('slot_date', { ascending: true })
    .order('slot_start_time', { ascending: true })

  if (date) query = query.eq('slot_date', date)

  const { data: appointments } = await query
  return NextResponse.json({ appointments: appointments ?? [] })
}
