'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { createSlotsSchema, bulkCreateSlotsSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createAvailabilitySlots(data: unknown) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const parsed = createSlotsSchema.safeParse(data)
  if (!parsed.success) return { error: 'VALIDATION_ERROR' as const }

  const { date, barber_id, slots } = parsed.data

  // Reject past dates
  const today = new Date().toISOString().split('T')[0]
  if (date < today) return { error: 'PAST_DATE' as const }

  const supabase = await createClient()
  const rows = slots.map((s) => ({
    date,
    barber_id,
    start_time: s.start_time,
    end_time: s.end_time,
  }))

  const { error, data: inserted } = await supabase
    .from('availability_slots')
    .insert(rows)
    .select('id')

  if (error) return { error: 'DUPLICATE_SLOT' as const }
  revalidatePath('/admin/schedule')
  return { created: inserted?.length ?? rows.length }
}

export async function bulkCreateSlots(data: unknown) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const parsed = bulkCreateSlotsSchema.safeParse(data)
  if (!parsed.success) return { error: 'VALIDATION_ERROR' as const }

  const { date, barber_id, from_time, to_time, slot_duration } = parsed.data

  // Reject past dates
  const today = new Date().toISOString().split('T')[0]
  if (date < today) return { error: 'VALIDATION_ERROR' as const }

  // Generate slots
  const slots: Array<{ date: string; barber_id: string; start_time: string; end_time: string }> = []
  const [fromH, fromM] = from_time.split(':').map(Number)
  const [toH, toM] = to_time.split(':').map(Number)
  let current = fromH * 60 + fromM
  const end = toH * 60 + toM

  while (current + slot_duration <= end) {
    const startH = Math.floor(current / 60).toString().padStart(2, '0')
    const startMin = (current % 60).toString().padStart(2, '0')
    const endTotal = current + slot_duration
    const endH = Math.floor(endTotal / 60).toString().padStart(2, '0')
    const endMin = (endTotal % 60).toString().padStart(2, '0')
    slots.push({
      date,
      barber_id,
      start_time: `${startH}:${startMin}`,
      end_time: `${endH}:${endMin}`,
    })
    current += slot_duration
  }

  if (slots.length === 0) return { error: 'VALIDATION_ERROR' as const }

  const supabase = await createClient()
  const { error } = await supabase
    .from('availability_slots')
    .upsert(slots, { onConflict: 'date,start_time,barber_id', ignoreDuplicates: true })

  if (error) return { error: 'VALIDATION_ERROR' as const }
  revalidatePath('/admin/schedule')
  return { created: slots.length }
}

/**
 * Open or close a set of hours across one or more dates for a barber — the
 * engine behind the simplified "Horarios" designer.
 *
 * - Open  → upserts availability_slots (ignores duplicates).
 * - Close → deletes matching slots, but SKIPS any with a confirmed booking
 *           (same protection as deleteAvailabilitySlot). Returns how many were
 *           skipped so the UI can warn.
 *
 * Reads/writes only availability_slots — client booking, agenda and the Hoy
 * panel all read the same table, so changes reflect automatically.
 */
export async function applySchedule(input: {
  barber_id: string
  dates: string[]
  times: { start_time: string; end_time: string }[]
  action: 'open' | 'close'
}): Promise<
  | { opened: number; closed: number; skipped: number }
  | { error: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'PAST_DATE' | 'DB_ERROR' }
> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const { barber_id, dates, times, action } = input
  const timeRe = /^\d{2}:\d{2}$/

  if (!barber_id) return { error: 'VALIDATION_ERROR' as const }
  if (!Array.isArray(dates) || dates.length === 0) return { error: 'VALIDATION_ERROR' as const }
  if (!Array.isArray(times) || times.length === 0) return { error: 'VALIDATION_ERROR' as const }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  for (const d of dates) if (!dateRe.test(d)) return { error: 'VALIDATION_ERROR' as const }
  for (const t of times) {
    const s = t.start_time.slice(0, 5)
    const e = t.end_time.slice(0, 5)
    if (!timeRe.test(s) || !timeRe.test(e) || s >= e) return { error: 'VALIDATION_ERROR' as const }
  }

  // Reject past dates (today allowed)
  const today = new Date().toISOString().split('T')[0]
  if (dates.some((d) => d < today)) return { error: 'PAST_DATE' as const }

  const supabase = await createClient()

  if (action === 'open') {
    const rows: Array<{ date: string; barber_id: string; start_time: string; end_time: string }> = []
    for (const date of dates) {
      for (const t of times) {
        rows.push({ date, barber_id, start_time: t.start_time.slice(0, 5), end_time: t.end_time.slice(0, 5) })
      }
    }
    const { error } = await supabase
      .from('availability_slots')
      .upsert(rows, { onConflict: 'date,start_time,barber_id', ignoreDuplicates: true })
    if (error) return { error: 'DB_ERROR' as const }

    revalidatePath('/admin/schedule')
    revalidatePath('/admin/agenda')
    revalidatePath('/admin/hoy')
    revalidatePath('/')
    return { opened: rows.length, closed: 0, skipped: 0 }
  }

  // action === 'close'
  const startSet = new Set(times.map((t) => t.start_time.slice(0, 5)))

  // Existing slots for these dates+barber
  const { data: existing, error: exErr } = await supabase
    .from('availability_slots')
    .select('id, date, start_time')
    .in('date', dates)
    .eq('barber_id', barber_id)
  if (exErr) return { error: 'DB_ERROR' as const }

  // Confirmed bookings for these dates+barber → protected, cannot close
  const { data: appts } = await supabase
    .from('appointments')
    .select('slot_date, slot_start_time')
    .in('slot_date', dates)
    .eq('barber_id', barber_id)
    .eq('status', 'confirmed')

  const bookedSet = new Set(
    (appts ?? []).map((a) => `${a.slot_date}|${a.slot_start_time.slice(0, 5)}`)
  )

  const targets = (existing ?? []).filter((s) => startSet.has(s.start_time.slice(0, 5)))
  const deletable = targets.filter((s) => !bookedSet.has(`${s.date}|${s.start_time.slice(0, 5)}`))
  const skipped = targets.length - deletable.length

  if (deletable.length > 0) {
    const { error: delErr } = await supabase
      .from('availability_slots')
      .delete()
      .in('id', deletable.map((s) => s.id))
    if (delErr) return { error: 'DB_ERROR' as const }
  }

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/agenda')
  revalidatePath('/admin/hoy')
  revalidatePath('/')
  return { opened: 0, closed: deletable.length, skipped }
}

export async function deleteAvailabilitySlot(slotId: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()

  const { data: slot } = await supabase
    .from('availability_slots')
    .select('date, start_time, barber_id')
    .eq('id', slotId)
    .maybeSingle()
  if (!slot) return { error: 'NOT_FOUND' as const }

  // Check no confirmed booking for this slot — scoped to this slot's barber
  let bookingQuery = supabase
    .from('appointments')
    .select('id')
    .eq('slot_date', slot.date)
    .eq('slot_start_time', slot.start_time)
    .eq('status', 'confirmed')
  if (slot.barber_id) bookingQuery = bookingQuery.eq('barber_id', slot.barber_id)
  const { data: booking } = await bookingQuery.maybeSingle()
  if (booking) return { error: 'HAS_BOOKING' as const }

  await supabase.from('availability_slots').delete().eq('id', slotId)
  revalidatePath('/admin/schedule')
  return { success: true as const }
}
