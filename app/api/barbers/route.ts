import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: barbers, error } = await supabase
    .from('barbers')
    .select('id, name, title, photo_url, is_active, display_order, created_at')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch barbers' }, { status: 500 })
  }

  return NextResponse.json(
    { barbers: barbers ?? [] },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
