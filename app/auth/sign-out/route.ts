import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Use request origin so redirect works in both local and production
  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL('/', origin))
}
