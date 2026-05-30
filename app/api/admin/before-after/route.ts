import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/* POST /api/admin/before-after — upload a before+after pair */
export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const beforeFile  = formData.get('before_file')  as File | null
  const afterFile   = formData.get('after_file')   as File | null
  const description = formData.get('description')  as string | null
  const orderRaw    = formData.get('display_order') as string | null
  const displayOrder = orderRaw ? parseInt(orderRaw, 10) || 0 : 0

  if (!beforeFile || !afterFile) {
    return NextResponse.json({ error: 'MISSING_FILES' }, { status: 400 })
  }
  if (!beforeFile.type.startsWith('image/') || !afterFile.type.startsWith('image/')) {
    return NextResponse.json({ error: 'INVALID_FILE' }, { status: 400 })
  }

  const supabase = await createClient()
  const uid = crypto.randomUUID()
  const beforeExt = beforeFile.name.split('.').pop() ?? 'jpg'
  const afterExt  = afterFile.name.split('.').pop()  ?? 'jpg'
  const beforePath = `${uid}-before.${beforeExt}`
  const afterPath  = `${uid}-after.${afterExt}`

  const [beforeBuf, afterBuf] = await Promise.all([
    beforeFile.arrayBuffer(),
    afterFile.arrayBuffer(),
  ])

  const [beforeUpload, afterUpload] = await Promise.all([
    supabase.storage.from('before-after').upload(beforePath, beforeBuf, { contentType: beforeFile.type }),
    supabase.storage.from('before-after').upload(afterPath,  afterBuf,  { contentType: afterFile.type }),
  ])

  if (beforeUpload.error || afterUpload.error) {
    await supabase.storage.from('before-after').remove([beforePath, afterPath])
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
  }

  const beforeUrl = supabase.storage.from('before-after').getPublicUrl(beforePath).data.publicUrl
  const afterUrl  = supabase.storage.from('before-after').getPublicUrl(afterPath).data.publicUrl

  const { data: item, error: dbError } = await supabase
    .from('before_after_items')
    .insert({ before_url: beforeUrl, before_path: beforePath, after_url: afterUrl, after_path: afterPath, description, display_order: displayOrder })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('before-after').remove([beforePath, afterPath])
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ item }, { status: 201 })
}

/* DELETE /api/admin/before-after?id=xxx */
export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: item } = await supabase
    .from('before_after_items')
    .select('before_path, after_path')
    .eq('id', id)
    .maybeSingle()

  if (item) {
    await supabase.storage.from('before-after').remove([item.before_path, item.after_path])
  }

  await supabase.from('before_after_items').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
