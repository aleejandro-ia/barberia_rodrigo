import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true })

  return NextResponse.json({ services: services ?? [] })
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: service, error } = await supabase
    .from('services')
    .insert({
      name: body.name.trim(),
      price_eur: body.price_eur ?? 0,
      duration_minutes: body.duration_minutes ?? 30,
      display_order: body.display_order ?? 0,
      is_active: true,
    })
    .select()
    .single()

  if (error || !service) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  return NextResponse.json({ service }, { status: 201 })
}
