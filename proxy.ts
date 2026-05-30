import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  // Protect admin routes
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (user.email !== adminEmail) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
