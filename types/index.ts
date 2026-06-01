export type AppointmentStatus =
  | 'confirmed'
  | 'cancelled'
  | 'cancelled_by_client'
  | 'cancelled_by_admin'
  | 'rescheduled'
  | 'completed'
  | 'no_show'

export interface Appointment {
  id: string
  user_id?: string | null   // null = admin walk-in (sin cuenta de cliente)
  slot_date: string
  slot_start_time: string
  slot_end_time: string
  client_name: string
  client_phone: string
  notes?: string
  status: AppointmentStatus
  created_at: string
  cancelled_at?: string | null
  cancellation_reason?: string | null
  rescheduled_at?: string | null
  previous_slot_date?: string | null
  previous_slot_start_time?: string | null
  completed_at?: string | null
  reminder_24h_sent_at?: string | null
  reminder_2h_sent_at?: string | null
  barber_id?: string | null
}

export interface AvailabilitySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  barber_id?: string | null
  blocked_reason?: string | null
  updated_at?: string
}

export interface GalleryImage {
  id: string
  url: string
  alt_text?: string
  display_order: number
}

export interface Profile {
  id: string
  full_name?: string
  phone?: string
  created_at: string
}

/* ─── Agenda types ───────────────────────────────────────────── */

export interface AgendaSlot {
  slot: AvailabilitySlot
  appointment: Appointment | null
}

export interface AgendaDay {
  date: string           // 'YYYY-MM-DD'
  slots: AgendaSlot[]
  totalSlots: number
  confirmedCount: number
  blockedCount: number
  freeCount: number
}

/* ─── Phase 2: Client Premium types ─────────────────────────── */

export interface BookingSettings {
  cancel_hours_before: number
  reschedule_hours_before: number
  advance_booking_days: number
  min_hours_advance: number
  whatsapp_phone: string
  business_name: string
  business_location: string
  whatsapp_cancel_msg: string
  whatsapp_reschedule_msg: string
  reminders_enabled: boolean
  reminder_24h_enabled: boolean
  reminder_2h_enabled: boolean
  bookings_enabled: boolean
}

export interface Service {
  id: string
  name: string
  price_eur: number
  duration_minutes: number
  is_active: boolean
  display_order: number
  created_at?: string
}

export interface Barber {
  id: string
  name: string
  title: string
  photo_url?: string | null
  is_active: boolean
  display_order: number
  created_at?: string
}

export function isActiveFutureAppointment(appt: Appointment, today: string): boolean {
  return appt.status === 'confirmed' && appt.slot_date >= today
}

export function isCancelledStatus(status: AppointmentStatus): boolean {
  return status === 'cancelled' || status === 'cancelled_by_client' || status === 'cancelled_by_admin'
}
