'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { addDays, parseISO, format, getDay } from 'date-fns'

export interface ScheduleEntry {
  day: number       // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string // 'HH:MM'
  end_time: string   // 'HH:MM'
}

function generateSlots(date: string, start: string, end: string, barber_id: string) {
  const slots: { date: string; barber_id: string; start_time: string; end_time: string; is_available: boolean }[] = []
  let current = start
  while (current < end) {
    const [h, m] = current.split(':').map(Number)
    const next = `${String(h + (m === 30 ? 1 : 0)).padStart(2, '0')}:${m === 30 ? '00' : '30'}`
    if (next > end) break
    slots.push({ date, barber_id, start_time: current, end_time: next, is_available: true })
    current = next
  }
  return slots
}

export async function getScheduleTemplate(barber_id?: string): Promise<ScheduleEntry[]> {
  const supabase = await createClient()
  const key = barber_id ? `schedule_template_${barber_id}` : 'schedule_template'
  const { data } = await supabase
    .from('booking_settings')
    .select('value')
    .eq('key', key)
    .single()
  if (!data?.value) return []
  try {
    return JSON.parse(data.value) as ScheduleEntry[]
  } catch {
    return []
  }
}

export async function saveScheduleTemplate(
  template: ScheduleEntry[],
  barber_id?: string
): Promise<{ success: true } | { error: 'UNAUTHORIZED' | 'VALIDATION_ERROR' }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  for (const entry of template) {
    if (entry.day < 0 || entry.day > 6) return { error: 'VALIDATION_ERROR' }
    if (!/^\d{2}:\d{2}$/.test(entry.start_time)) return { error: 'VALIDATION_ERROR' }
    if (!/^\d{2}:\d{2}$/.test(entry.end_time)) return { error: 'VALIDATION_ERROR' }
    if (entry.start_time >= entry.end_time) return { error: 'VALIDATION_ERROR' }
  }

  const key = barber_id ? `schedule_template_${barber_id}` : 'schedule_template'
  const supabase = await createClient()
  await supabase
    .from('booking_settings')
    .upsert(
      { key, value: JSON.stringify(template), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  revalidatePath('/admin/schedule')
  revalidatePath('/admin')
  return { success: true }
}

export async function generateSlotsFromTemplate(
  startDate: string,
  weeks: number,
  barber_id?: string
): Promise<{ created: number; skipped: number } | { error: 'UNAUTHORIZED' | 'NO_TEMPLATE' | 'VALIDATION_ERROR' }> {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' }

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { error: 'VALIDATION_ERROR' }
  if (!weeks || weeks < 1 || weeks > 52) return { error: 'VALIDATION_ERROR' }
  if (!barber_id) return { error: 'VALIDATION_ERROR' }

  const template = await getScheduleTemplate(barber_id)
  if (!template || template.length === 0) return { error: 'NO_TEMPLATE' }

  const supabase = await createClient()
  const start = parseISO(startDate)
  const total = weeks * 7
  let created = 0
  let skipped = 0

  for (let i = 0; i < total; i++) {
    const date = addDays(start, i)
    const dayOfWeek = getDay(date)
    const dateStr = format(date, 'yyyy-MM-dd')

    const match = template.find((t) => t.day === dayOfWeek)
    if (!match) continue

    const slots = generateSlots(dateStr, match.start_time, match.end_time, barber_id)
    if (slots.length === 0) continue

    const { data } = await supabase
      .from('availability_slots')
      .upsert(slots, { onConflict: 'date,start_time,barber_id', ignoreDuplicates: true })
      .select()

    const inserted = data?.length ?? 0
    created += inserted
    skipped += slots.length - inserted
  }

  revalidatePath('/admin/schedule')
  return { created, skipped }
}
