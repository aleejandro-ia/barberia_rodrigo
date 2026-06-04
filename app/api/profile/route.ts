import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({
    profile: {
      email: user.email ?? null,
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  })
}
