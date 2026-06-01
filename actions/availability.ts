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
