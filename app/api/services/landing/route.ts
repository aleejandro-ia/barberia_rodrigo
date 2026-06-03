import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, description, price_eur, icon_key, display_order')
    .eq('is_active', true)
    .eq('show_in_landing', true)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  return NextResponse.json({ services: services ?? [] })
}
