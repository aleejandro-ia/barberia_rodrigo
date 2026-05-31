import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('booking_settings')
    .select('key, value')
    .in('key', [
      'cancel_hours_before',
      'reschedule_hours_before',
      'advance_booking_days',
      'min_hours_advance',
      'whatsapp_phone',
      'business_name',
      'whatsapp_cancel_msg',
      'whatsapp_reschedule_msg',
    ])

  const m: Record<string, string> = {}
  for (const row of data ?? []) m[row.key] = row.value

  return NextResponse.json({
    settings: {
      cancel_hours_before:     parseInt(m.cancel_hours_before     ?? '3'),
      reschedule_hours_before: parseInt(m.reschedule_hours_before ?? '3'),
      advance_booking_days:    parseInt(m.advance_booking_days    ?? '90'),
      min_hours_advance:       parseInt(m.min_hours_advance       ?? '2'),
      whatsapp_phone:          m.whatsapp_phone          ?? '34600000000',
      business_name:           m.business_name           ?? 'BG Barber',
      whatsapp_cancel_msg:     m.whatsapp_cancel_msg     ?? 'Hola, necesito cancelar mi cita.',
      whatsapp_reschedule_msg: m.whatsapp_reschedule_msg ?? 'Hola, me gustaría cambiar mi cita.',
    },
  })
}
