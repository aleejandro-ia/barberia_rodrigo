import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/* POST /api/admin/settings — upload image for a setting key (hero_image | about_portrait) */
export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const key  = formData.get('key')  as string | null
  const file = formData.get('file') as File | null

  const ALLOWED_KEYS = ['hero_image', 'about_portrait']
  if (!key || !ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: 'INVALID_KEY' }, { status: 400 })
  }
  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'INVALID_FILE' }, { status: 400 })
  }

  const supabase = await createClient()

  // Delete old image if exists
  const { data: existing } = await supabase
    .from('site_settings')
    .select('storage_path')
    .eq('key', key)
    .maybeSingle()

  if (existing?.storage_path) {
    await supabase.storage.from('site-images').remove([existing.storage_path])
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const storagePath = `${key}-${crypto.randomUUID()}.${ext}`
  const buf = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('site-images')
    .upload(storagePath, buf, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('site-images').getPublicUrl(storagePath)

  await supabase
    .from('site_settings')
    .upsert({ key, image_url: publicUrl, storage_path: storagePath, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  return NextResponse.json({ url: publicUrl })
}
