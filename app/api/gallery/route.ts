import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: images } = await supabase
    .from('gallery_images')
    .select('id, url, alt_text, display_order')
    .order('display_order', { ascending: true })

  return NextResponse.json({ images: images ?? [] })
}
