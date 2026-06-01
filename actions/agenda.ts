'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import {
  adminCreateAppointmentSchema,
  adminEditAppointmentSchema,
} from '@/lib/validations'

/* ─── Types ──────────────────────────────────────────────────── */
type AdminCreateError = 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'SLOT_NOT_FOUND' | 'SLOT_TAKEN'
type AdminEditError   = 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'NOT_FOUND'
type ToggleBlockError = 'UNAUTHORIZED' | 'NOT_FOUND' | 'HAS_BOOKING'
type EditSlotError    = 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'HAS_BOOKING' | 'DUPLICATE_SLOT'

function revalidate() {
  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
}

/* ─── adminCreateAppointment ─────────────────────────────────── */
export async function adminCreateAppointment(
  data: unknown
): Promise<{ appointment: { id: string } } | { error: AdminCreateError }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const parsed = adminCreateAppointmentSchema.safeParse(data)
  if (!parsed.success) return { error: 'VALIDATION_ERROR' }

  const { slot_date, slot_start_time, slot_end_time, barber_id, client_name, client_phone, notes } = parsed.data

  const supabase = await createClient()

  // Slot must exist and be available — filter by barber_id if provided
  let slotQuery = supabase
    .from('availability_slots')
    .select('id')
    .eq('date', slot_date)
    .eq('start_time', slot_start_time)
    .eq('is_available', true)
  if (barber_id) slotQuery = slotQuery.eq('barber_id', barber_id)
  const { data: slot } = await slotQuery.maybeSingle()

  if (!slot) return { error: 'SLOT_NOT_FOUND' }

  // No confirmed appointment already on that slot (for this barber)
  let existQuery = supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot_date)
    .eq('slot_start_time', slot_start_time)
    .eq('status', 'confirmed')
  if (barber_id) existQuery = existQuery.eq('barber_id', barber_id)
  const { data: existing } = await existQuery.maybeSingle()

  if (existing) return { error: 'SLOT_TAKEN' }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: null,
      slot_date,
      slot_start_time,
      slot_end_time,
      barber_id: barber_id ?? null,
      client_name,
      client_phone,
      notes: notes ?? null,
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (error || !appointment) return { error: 'SLOT_TAKEN' }

  revalidate()
  return { appointment: { id: appointment.id } }
}

/* ─── adminEditAppointment ───────────────────────────────────── */
export async function adminEditAppointment(
  appointmentId: string,
  data: unknown
): Promise<{ success: true } | { error: AdminEditError }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const parsed = adminEditAppointmentSchema.safeParse(data)
  if (!parsed.success) return { error: 'VALIDATION_ERROR' }

  const { client_name, client_phone, notes } = parsed.data

  const supabase = await createClient()

  const { data: appt } = await supabase
    .from('appointments')
    .select('id')
    .eq('id', appointmentId)
    .maybeSingle()

  if (!appt) return { error: 'NOT_FOUND' }

  await supabase
    .from('appointments')
    .update({ client_name, client_phone, notes: notes ?? null })
    .eq('id', appointmentId)

  revalidate()
  return { success: true }
}

/* ─── adminToggleSlotBlock ───────────────────────────────────── */
export async function adminToggleSlotBlock(
  slotId: string,
  block: boolean,
  blockedReason?: string
): Promise<{ success: true } | { error: ToggleBlockError }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()

  const { data: slot } = await supabase
    .from('availability_slots')
    .select('id, date, start_time')
    .eq('id', slotId)
    .maybeSingle()

  if (!slot) return { error: 'NOT_FOUND' }

  if (block) {
    // Cannot block a slot with a confirmed appointment
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('slot_date', slot.date)
      .eq('slot_start_time', slot.start_time)
      .eq('status', 'confirmed')
      .maybeSingle()

    if (existing) return { error: 'HAS_BOOKING' }
  }

  await supabase
    .from('availability_slots')
    .update({
      is_available: !block,
      blocked_reason: block ? (blockedReason ?? null) : null,
    })
    .eq('id', slotId)

  revalidate()
  return { success: true }
}

/* ─── adminEditSlotTimes ─────────────────────────────────────── */
export async function adminEditSlotTimes(
  slotId: string,
  data: { start_time: string; end_time: string }
): Promise<{ success: true } | { error: EditSlotError }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const timeRe = /^\d{2}:\d{2}$/
  if (!timeRe.test(data.start_time) || !timeRe.test(data.end_time)) return { error: 'VALIDATION_ERROR' }
  if (data.start_time >= data.end_time) return { error: 'VALIDATION_ERROR' }

  const supabase = await createClient()

  const { data: slot } = await supabase
    .from('availability_slots')
    .select('id, date, start_time')
    .eq('id', slotId)
    .maybeSingle()

  if (!slot) return { error: 'NOT_FOUND' }

  // No confirmed appointment on this slot
  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot.date)
    .eq('slot_start_time', slot.start_time)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (existing) return { error: 'HAS_BOOKING' }

  // No other slot already has the new start_time on same date
  const { data: conflict } = await supabase
    .from('availability_slots')
    .select('id')
    .eq('date', slot.date)
    .eq('start_time', data.start_time)
    .neq('id', slotId)
    .maybeSingle()

  if (conflict) return { error: 'DUPLICATE_SLOT' }

  await supabase
    .from('availability_slots')
    .update({ start_time: data.start_time, end_time: data.end_time })
    .eq('id', slotId)

  revalidate()
  return { success: true }
}

/* ─── adminRescheduleAppointment ─────────────────────────────── */
export async function adminRescheduleAppointment(
  appointmentId: string,
  newSlot: { slot_date: string; slot_start_time: string; slot_end_time: string; barber_id?: string }
): Promise<{ success: true } | { error: 'UNAUTHORIZED' | 'NOT_FOUND' | 'NOT_CONFIRMED' | 'SLOT_TAKEN' }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status, slot_date, slot_start_time, barber_id, client_name, user_id, notes')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' }

  // Check new slot is not already taken — scoped to the target barber
  const targetBarberId = newSlot.barber_id ?? appt.barber_id
  let takenQuery = supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', newSlot.slot_date)
    .eq('slot_start_time', newSlot.slot_start_time)
    .eq('status', 'confirmed')
    .neq('id', appointmentId)
  if (targetBarberId) takenQuery = takenQuery.eq('barber_id', targetBarberId)
  const { data: taken } = await takenQuery.maybeSingle()
  if (taken) return { error: 'SLOT_TAKEN' }

  // Build update payload — include barber_id if it's changing
  const updatePayload: Record<string, unknown> = {
    slot_date:                newSlot.slot_date,
    slot_start_time:          newSlot.slot_start_time,
    slot_end_time:            newSlot.slot_end_time,
    rescheduled_at:           new Date().toISOString(),
    previous_slot_date:       appt.slot_date,
    previous_slot_start_time: appt.slot_start_time,
    reminder_24h_sent_at:     null,
    reminder_2h_sent_at:      null,
  }
  if (newSlot.barber_id && newSlot.barber_id !== appt.barber_id) {
    updatePayload.barber_id = newSlot.barber_id
  }

  await supabase.from('appointments').update(updatePayload).eq('id', appointmentId)

  // Email notification (optional — degrades gracefully)
  try {
    // Getting client email requires service_role — skip for now
    // Will be enhanced when SUPABASE_SERVICE_ROLE_KEY is used in cron
  } catch (e) {
    console.warn('[adminRescheduleAppointment] email skipped:', e)
  }

  revalidate()
  revalidatePath('/mis-citas')
  return { success: true }
}

/* ─── adminMarkNoShow ────────────────────────────────────────── */
export async function adminMarkNoShow(
  appointmentId: string
): Promise<{ success: true } | { error: 'UNAUTHORIZED' | 'NOT_FOUND' | 'NOT_CONFIRMED' }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' }

  await supabase.from('appointments').update({ status: 'no_show' }).eq('id', appointmentId)

  revalidate()
  return { success: true }
}

/* ─── adminMarkCompleted ─────────────────────────────────────── */
export async function adminMarkCompleted(
  appointmentId: string
): Promise<{ success: true } | { error: 'UNAUTHORIZED' | 'NOT_FOUND' | 'NOT_CONFIRMED' }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' }

  await supabase.from('appointments').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', appointmentId)

  revalidate()
  return { success: true }
}

/* ─── adminCopyWeekToNext ────────────────────────────────────── */
export async function adminCopyWeekToNext(
  weekStart: string // 'YYYY-MM-DD' — Monday of the week to copy
): Promise<{ created: number; skipped: number } | { error: 'UNAUTHORIZED' | 'NOT_FOUND' }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()

  // Get all slots for this week (Mon to Sun)
  const weekStartDate = new Date(weekStart)
  const weekEndDate = new Date(weekStart)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  const { data: slots } = await supabase
    .from('availability_slots')
    .select('date, start_time, end_time, is_available')
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (!slots || slots.length === 0) return { error: 'NOT_FOUND' }

  // Build next-week slots (+7 days)
  const nextWeekSlots = slots.map(slot => {
    const d = new Date(slot.date)
    d.setDate(d.getDate() + 7)
    return {
      date: d.toISOString().split('T')[0],
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
    }
  })

  // Insert one by one to handle duplicates gracefully
  let created = 0
  let skipped = 0
  for (const slot of nextWeekSlots) {
    const { error: insertError } = await supabase
      .from('availability_slots')
      .insert(slot)
    if (insertError) skipped++
    else created++
  }

  revalidate()
  return { created, skipped }
}
