'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { bookAppointmentSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getBookingSettings } from '@/actions/bookingSettings'
import { hoursUntilMadrid } from '@/lib/datetime'

export async function bookAppointment(data: unknown, barber_id?: string | null): Promise<
  | { appointment: { id: string; slot_date: string; slot_start_time: string; status: string } }
  | { error: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'BOOKINGS_DISABLED' | 'TOO_SOON' | 'SLOT_NOT_FOUND' | 'SLOT_TAKEN' | 'ALREADY_HAS_BOOKING' }
> {
  const parsed = bookAppointmentSchema.safeParse(data)
  if (!parsed.success) return { error: 'VALIDATION_ERROR' as const }

  const user = await getUser()
  if (!user) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes } =
    parsed.data

  // Check bookings enabled
  const settings = await getBookingSettings()
  if (!settings.bookings_enabled) return { error: 'BOOKINGS_DISABLED' as const }

  // slot_date must not be in the past
  const today = new Date().toISOString().split('T')[0]
  if (slot_date < today) return { error: 'VALIDATION_ERROR' as const }

  // Check min_hours_advance (slot times are Europe/Madrid wall-clock)
  const hoursUntil = hoursUntilMadrid(slot_date, slot_start_time)
  if (hoursUntil < settings.min_hours_advance) return { error: 'TOO_SOON' as const }

  // Check slot exists and is available — scoped to the chosen barber
  let slotQuery = supabase
    .from('availability_slots')
    .select('id')
    .eq('date', slot_date)
    .eq('start_time', slot_start_time)
    .eq('is_available', true)
  if (barber_id != null) slotQuery = slotQuery.eq('barber_id', barber_id)
  const { data: slot } = await slotQuery.limit(1).maybeSingle()
  if (!slot) return { error: 'SLOT_NOT_FOUND' as const }

  // Check slot not already booked — scoped to the chosen barber
  let existingQuery = supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot_date)
    .eq('slot_start_time', slot_start_time)
    .eq('status', 'confirmed')
  if (barber_id != null) existingQuery = existingQuery.eq('barber_id', barber_id)
  const { data: existingBooking } = await existingQuery.limit(1).maybeSingle()
  if (existingBooking) return { error: 'SLOT_TAKEN' as const }

  // NOTE: ALREADY_HAS_BOOKING check removed — multiple bookings allowed, UI warns instead

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
      ...(barber_id != null ? { barber_id } : {}),
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
    .select('id, user_id, status, slot_date, slot_start_time, client_name, client_phone, notes')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.user_id !== user.id) return { error: 'NOT_OWNER' as const }
  if (appt.status !== 'confirmed') return { error: 'ALREADY_CANCELLED' as const }

  // Validate cancellation time window (slot times are Europe/Madrid wall-clock)
  const settings = await getBookingSettings()
  const hoursUntil = hoursUntilMadrid(appt.slot_date, appt.slot_start_time)
  if (hoursUntil < settings.cancel_hours_before) return { error: 'CANCEL_TOO_LATE' as const }

  const { data: updated, error: updateError } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled_by_client',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    return { error: 'UPDATE_FAILED' as const }
  }

  // Email (optional — degrades gracefully)
  try {
    if (user.email) {
      const { sendCancellationEmail } = await import('@/lib/email/resend')
      await sendCancellationEmail({
        to: user.email,
        name: appt.client_name,
        date: appt.slot_date,
        time: appt.slot_start_time.slice(0, 5),
        service: appt.notes ?? undefined,
        business: settings.business_name,
      })
    }
  } catch (e) {
    console.warn('[cancelAppointment] email failed:', e)
  }

  revalidatePath('/')
  revalidatePath('/mis-citas')
  return { success: true as const }
}

export async function rescheduleAppointment(
  appointmentId: string,
  newSlot: { slot_date: string; slot_start_time: string; slot_end_time: string }
) {
  const user = await getUser()
  if (!user) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, user_id, status, slot_date, slot_start_time, barber_id')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.user_id !== user.id) return { error: 'NOT_OWNER' as const }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' as const }

  // Validate reschedule time window (slot times are Europe/Madrid wall-clock)
  const settings = await getBookingSettings()
  const hoursUntil = hoursUntilMadrid(appt.slot_date, appt.slot_start_time)
  if (hoursUntil < settings.reschedule_hours_before) return { error: 'RESCHEDULE_TOO_LATE' as const }

  // Validate new slot is not in the past
  const today = new Date().toISOString().split('T')[0]
  if (newSlot.slot_date < today) return { error: 'VALIDATION_ERROR' as const }

  // Check new slot exists and is available — scoped to the same barber
  let slotQuery = supabase
    .from('availability_slots')
    .select('id')
    .eq('date', newSlot.slot_date)
    .eq('start_time', newSlot.slot_start_time)
    .eq('is_available', true)
  if (appt.barber_id) slotQuery = slotQuery.eq('barber_id', appt.barber_id)
  const { data: slot } = await slotQuery.maybeSingle()
  if (!slot) return { error: 'SLOT_NOT_FOUND' as const }

  // Check new slot not taken — scoped to the same barber
  let takenQuery = supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', newSlot.slot_date)
    .eq('slot_start_time', newSlot.slot_start_time)
    .eq('status', 'confirmed')
    .neq('id', appointmentId)
  if (appt.barber_id) takenQuery = takenQuery.eq('barber_id', appt.barber_id)
  const { data: taken } = await takenQuery.maybeSingle()
  if (taken) return { error: 'SLOT_TAKEN' as const }

  // UPDATE in-place — old slot is freed automatically
  const { data: updated, error: updateError } = await supabase
    .from('appointments')
    .update({
      slot_date: newSlot.slot_date,
      slot_start_time: newSlot.slot_start_time,
      slot_end_time: newSlot.slot_end_time,
      rescheduled_at: new Date().toISOString(),
      previous_slot_date: appt.slot_date,
      previous_slot_start_time: appt.slot_start_time,
      reminder_24h_sent_at: null,
      reminder_2h_sent_at: null,
    })
    .eq('id', appointmentId)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    return { error: 'UPDATE_FAILED' as const }
  }

  revalidatePath('/')
  revalidatePath('/mis-citas')
  return { success: true as const }
}

export async function adminCancelAppointment(appointmentId: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status, slot_date, slot_start_time, client_name, client_phone, notes, user_id')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.status === 'cancelled' || appt.status === 'cancelled_by_admin') {
    return { error: 'ALREADY_CANCELLED' as const }
  }

  await supabase.from('appointments').update({
    status: 'cancelled_by_admin',
    cancelled_at: new Date().toISOString(),
  }).eq('id', appointmentId)

  // Email client (optional — walk-ins skipped, degrades gracefully)
  try {
    if (appt.user_id) {
      // Getting client email requires service_role — skip for now
      // Will be handled by cron with service_role key
    }
  } catch (e) {
    console.warn('[adminCancelAppointment] email skipped:', e)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/agenda')
  revalidatePath('/mis-citas')
  return { success: true as const }
}
