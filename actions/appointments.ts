'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { bookAppointmentSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function bookAppointment(data: unknown) {
  const parsed = bookAppointmentSchema.safeParse(data)
  if (!parsed.success) return { error: 'VALIDATION_ERROR' as const }

  const user = await getUser()
  if (!user) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes } =
    parsed.data

  // slot_date must not be in the past
  const today = new Date().toISOString().split('T')[0]
  if (slot_date < today) return { error: 'VALIDATION_ERROR' as const }

  // Check slot exists and is available
  const { data: slot } = await supabase
    .from('availability_slots')
    .select('id')
    .eq('date', slot_date)
    .eq('start_time', slot_start_time)
    .eq('is_available', true)
    .maybeSingle()
  if (!slot) return { error: 'SLOT_NOT_FOUND' as const }

  // Check slot not already booked
  const { data: existingBooking } = await supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot_date)
    .eq('slot_start_time', slot_start_time)
    .eq('status', 'confirmed')
    .maybeSingle()
  if (existingBooking) return { error: 'SLOT_TAKEN' as const }

  // Check user has no active future booking
  const { data: userBooking } = await supabase
    .from('appointments')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .gte('slot_date', today)
    .maybeSingle()
  if (userBooking) return { error: 'ALREADY_HAS_BOOKING' as const }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      slot_date,
      slot_start_time,
      slot_end_time,
      client_name,
      client_phone,
      notes,
      status: 'confirmed',
    })
    .select('id, slot_date, slot_start_time, status')
    .single()

  if (error) return { error: 'SLOT_TAKEN' as const }

  revalidatePath('/')
  return { appointment }
}

export async function cancelAppointment(appointmentId: string) {
  const user = await getUser()
  if (!user) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, user_id, status')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.user_id !== user.id) return { error: 'NOT_OWNER' as const }
  if (appt.status === 'cancelled') return { error: 'ALREADY_CANCELLED' as const }

  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)
  revalidatePath('/')
  return { success: true as const }
}

export async function adminCancelAppointment(appointmentId: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.status === 'cancelled') return { error: 'ALREADY_CANCELLED' as const }

  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)
  revalidatePath('/admin')
  return { success: true as const }
}
