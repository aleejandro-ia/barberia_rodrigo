import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, slot_date, slot_start_time, slot_end_time, client_name, status, created_at')
    .eq('user_id', user.id)
    .order('slot_date', { ascending: true })
    .order('slot_start_time', { ascending: true })

  return NextResponse.json({ appointments: appointments ?? [] })
}
