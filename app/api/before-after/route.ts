import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('before_after_items')
    .select('id, before_url, after_url, description, display_order')
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ items: [] })
  return NextResponse.json({ items: data ?? [] })
}
