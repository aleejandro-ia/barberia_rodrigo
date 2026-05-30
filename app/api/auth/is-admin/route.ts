import { NextResponse } from 'next/server'
import { getUser, isAdmin } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  return NextResponse.json({ isAdmin: isAdmin(user) })
}
