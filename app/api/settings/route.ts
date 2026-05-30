import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('key, image_url')

  const settings: Record<string, string | null> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.image_url
  }
  return NextResponse.json({ settings })
}
