import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const altText = formData.get('alt_text') as string | null
  const displayOrderRaw = formData.get('display_order') as string | null
  const displayOrder = displayOrderRaw ? parseInt(displayOrderRaw, 10) || 0 : 0

  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'INVALID_FILE' }, { status: 400 })
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const storagePath = `gallery/${crypto.randomUUID()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })

  const {
    data: { publicUrl },
  } = supabase.storage.from('gallery').getPublicUrl(storagePath)

  const { data: image, error: dbError } = await supabase
    .from('gallery_images')
    .insert({
      url: publicUrl,
      storage_path: storagePath,
      alt_text: altText,
      display_order: displayOrder,
    })
    .select('id, url, alt_text, display_order')
    .single()

  if (dbError) {
    // Attempt to clean up the uploaded file
    await supabase.storage.from('gallery').remove([storagePath])
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
  }

  return NextResponse.json({ image }, { status: 201 })
}
