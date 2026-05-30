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

  const { slot_date, slot_start_time, slot_end_time, client_name, client_phone, notes } = parsed.data

  const supabase = await createClient()

  // Slot must exist and be available
  const { data: slot } = await supabase
    .from('availability_slots')
    .select('id')
    .eq('date', slot_date)
    .eq('start_time', slot_start_time)
    .eq('is_available', true)
    .maybeSingle()

  if (!slot) return { error: 'SLOT_NOT_FOUND' }

  // No confirmed appointment already on that slot
  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot_date)
    .eq('slot_start_time', slot_start_time)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (existing) return { error: 'SLOT_TAKEN' }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: null,
      slot_date,
      slot_start_time,
      slot_end_time,
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
