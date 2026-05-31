import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const supabase = await createClient()
  const { data: service, error } = await supabase
    .from('services')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error || !service) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ service })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const supabase = await createClient()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ success: true })
}
