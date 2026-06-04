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
    .select('id, barber_id')
    .eq('date', slot_date)
    .eq('start_time', slot_start_time)
    .eq('is_available', true)
  if (barber_id) slotQuery = slotQuery.eq('barber_id', barber_id)
  const { data: slot } = await slotQuery.limit(1).maybeSingle()

  if (!slot) return { error: 'SLOT_NOT_FOUND' }

  // Authoritative barber = the slot's own barber (never trust a missing client value)
  const effectiveBarberId = barber_id ?? slot.barber_id ?? null

  // No confirmed appointment already on that slot, scoped to the slot's barber
  let existQuery = supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot_date)
    .eq('slot_start_time', slot_start_time)
    .eq('status', 'confirmed')
  if (effectiveBarberId) existQuery = existQuery.eq('barber_id', effectiveBarberId)
  const { data: existing } = await existQuery.maybeSingle()

  if (existing) return { error: 'SLOT_TAKEN' }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: null,
      slot_date,
      slot_start_time,
      slot_end_time,
      barber_id: effectiveBarberId,
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
    .select('id, date, start_time, barber_id')
    .eq('id', slotId)
    .maybeSingle()

  if (!slot) return { error: 'NOT_FOUND' }

  if (block) {
    // Cannot block a slot with a confirmed appointment — scoped to this slot's barber
    let existingQuery = supabase
      .from('appointments')
      .select('id')
      .eq('slot_date', slot.date)
      .eq('slot_start_time', slot.start_time)
      .eq('status', 'confirmed')
    if (slot.barber_id) existingQuery = existingQuery.eq('barber_id', slot.barber_id)
    const { data: existing } = await existingQuery.maybeSingle()

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
    .select('id, date, start_time, barber_id')
    .eq('id', slotId)
    .maybeSingle()

  if (!slot) return { error: 'NOT_FOUND' }

  // No confirmed appointment on this slot — scoped to this slot's barber
  let existingQuery = supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot.date)
    .eq('slot_start_time', slot.start_time)
    .eq('status', 'confirmed')
  if (slot.barber_id) existingQuery = existingQuery.eq('barber_id', slot.barber_id)
  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) return { error: 'HAS_BOOKING' }

  // No other slot for THIS barber already has the new start_time on same date
  let conflictQuery = supabase
    .from('availability_slots')
    .select('id')
    .eq('date', slot.date)
    .eq('start_time', data.start_time)
    .neq('id', slotId)
  if (slot.barber_id) conflictQuery = conflictQuery.eq('barber_id', slot.barber_id)
  const { data: conflict } = await conflictQuery.maybeSingle()

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

  const { data: updated, error: updateError } = await supabase
    .from('appointments')
    .update(updatePayload)
    .eq('id', appointmentId)
    .select('id')
  // Unique-index violation (same barber already confirmed at that slot) → SLOT_TAKEN
  if (updateError || !updated || updated.length === 0) return { error: 'SLOT_TAKEN' }

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
  // Allow from 'confirmed' OR 'completed' — past confirmed bookings auto-flip
  // to 'completed', so a forgotten no-show is corrected from that state too.
  if (appt.status !== 'confirmed' && appt.status !== 'completed') return { error: 'NOT_CONFIRMED' }

  await supabase
    .from('appointments')
    .update({ status: 'no_show', completed_at: null })
    .eq('id', appointmentId)

  revalidate()
  revalidatePath('/mis-citas')
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
  // Allow from 'confirmed' OR 'no_show' — lets admin revert a wrong no-show.
  if (appt.status !== 'confirmed' && appt.status !== 'no_show') return { error: 'NOT_CONFIRMED' }

  await supabase.from('appointments').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', appointmentId)

  revalidate()
  revalidatePath('/mis-citas')
  return { success: true }
}

/* ─── adminCopyWeekToNext ────────────────────────────────────── */
export async function adminCopyWeekToNext(
  weekStart: string, // 'YYYY-MM-DD' — Monday of the week to copy
  barber_id?: string // when provided, copy only this barber's slots
): Promise<{ created: number; skipped: number } | { error: 'UNAUTHORIZED' | 'NOT_FOUND' }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  const supabase = await createClient()

  // Get all slots for this week (Mon to Sun)
  const weekEndDate = new Date(weekStart)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  // Include barber_id so each barber's slots are copied for the right barber
  let slotsQuery = supabase
    .from('availability_slots')
    .select('date, start_time, end_time, is_available, barber_id')
    .gte('date', weekStart)
    .lte('date', weekEnd)
  if (barber_id) slotsQuery = slotsQuery.eq('barber_id', barber_id)
  const { data: slots } = await slotsQuery

  if (!slots || slots.length === 0) return { error: 'NOT_FOUND' }

  // Build next-week slots (+7 days) — preserve barber_id
  const nextWeekSlots = slots.map(slot => {
    const d = new Date(slot.date)
    d.setDate(d.getDate() + 7)
    return {
      date: d.toISOString().split('T')[0],
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
      barber_id: slot.barber_id,
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
