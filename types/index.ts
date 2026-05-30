export type AppointmentStatus = 'confirmed' | 'cancelled'

export interface Appointment {
  id: string
  slot_date: string
  slot_start_time: string
  slot_end_time: string
  client_name: string
  client_phone: string
  notes?: string
  status: AppointmentStatus
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
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
