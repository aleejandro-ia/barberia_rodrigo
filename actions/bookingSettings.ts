'use server'
import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import type { BookingSettings } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getBookingSettings(): Promise<BookingSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('booking_settings').select('key, value')
  const m: Record<string, string> = {}
  for (const row of data ?? []) m[row.key] = row.value
  return {
    cancel_hours_before:     parseInt(m.cancel_hours_before     ?? '24'),
    reschedule_hours_before: parseInt(m.reschedule_hours_before ?? '24'),
    advance_booking_days:    parseInt(m.advance_booking_days    ?? '90'),
    min_hours_advance:       parseInt(m.min_hours_advance       ?? '2'),
    whatsapp_phone:          m.whatsapp_phone          ?? '34600000000',
    business_name:           m.business_name           ?? 'BG Barber',
    business_location:       m.business_location       ?? '',
    whatsapp_cancel_msg:     m.whatsapp_cancel_msg     ?? 'Hola, necesito cancelar mi cita.',
    whatsapp_reschedule_msg: m.whatsapp_reschedule_msg ?? 'Hola, me gustaría cambiar mi cita.',
    reminders_enabled:       (m.reminders_enabled      ?? 'true') === 'true',
    reminder_24h_enabled:    (m.reminder_24h_enabled   ?? 'true') === 'true',
    reminder_2h_enabled:     (m.reminder_2h_enabled    ?? 'true') === 'true',
    bookings_enabled:        (m.bookings_enabled        ?? 'true') === 'true',
  }
}

export async function updateBookingSetting(key: string, value: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }
  const supabase = await createClient()
  await supabase.from('booking_settings').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  revalidatePath('/admin/settings')
  return { success: true as const }
}
