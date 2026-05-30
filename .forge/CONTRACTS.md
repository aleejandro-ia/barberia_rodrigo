# API Contracts
Generated: 2026-05-29

## Architecture Note
This project uses Next.js App Router Server Actions for mutations and Route Handlers for queries. No separate REST API layer.

## Authentication
All mutations require an authenticated Supabase session (obtained via phone OTP or Google OAuth).
Admin mutations additionally require session email === process.env.ADMIN_EMAIL.
Supabase client handles JWT automatically via cookies.

---

## Public Endpoints (no auth required)

### GET gallery
**Route Handler:** GET /api/gallery
**Purpose:** Return all gallery images ordered by display_order
**Response 200:**
```json
{
  "images": [
    {
      "id": "uuid",
      "url": "https://supabase-storage-url/...",
      "alt_text": "string | null",
      "display_order": 0
    }
  ]
}
```

### GET available dates
**Route Handler:** GET /api/availability/dates?month=YYYY-MM
**Purpose:** Return dates that have at least one available slot in given month
**Response 200:**
```json
{
  "dates": ["2026-06-05", "2026-06-06"]
}
```

### GET available slots for a date
**Route Handler:** GET /api/availability/slots?date=YYYY-MM-DD
**Purpose:** Return available time slots for a specific date (not already booked)
**Response 200:**
```json
{
  "slots": [
    {
      "id": "uuid",
      "start_time": "09:00",
      "end_time": "09:30"
    }
  ]
}
```

---

## Client Endpoints (auth required)

### POST book appointment
**Server Action:** bookAppointment(data)
**Auth:** authenticated user
**Input:**
```ts
{
  slot_date: string       // "YYYY-MM-DD"
  slot_start_time: string // "HH:MM"
  slot_end_time: string   // "HH:MM"
  client_name: string     // required
  client_phone: string    // required
  notes?: string
}
```
**Validation:**
- User has no other 'confirmed' appointment in the future
- Slot exists in availability_slots and is not already booked
- slot_date is at least today (no past bookings)
**Response success:** `{ appointment: { id, slot_date, slot_start_time, status } }`
**Response error:** `{ error: "SLOT_TAKEN" | "ALREADY_HAS_BOOKING" | "SLOT_NOT_FOUND" | "VALIDATION_ERROR" }`

### POST cancel own appointment
**Server Action:** cancelAppointment(appointmentId)
**Auth:** owner of appointment
**Response success:** `{ success: true }`
**Response error:** `{ error: "NOT_FOUND" | "NOT_OWNER" | "ALREADY_CANCELLED" }`

### GET my appointments
**Route Handler:** GET /api/appointments/mine
**Auth:** authenticated user
**Response 200:**
```json
{
  "appointments": [
    {
      "id": "uuid",
      "slot_date": "YYYY-MM-DD",
      "slot_start_time": "HH:MM",
      "slot_end_time": "HH:MM",
      "client_name": "string",
      "status": "confirmed | cancelled",
      "created_at": "ISO8601"
    }
  ]
}
```

---

## Admin Endpoints (admin auth required)

### GET all appointments
**Route Handler:** GET /api/admin/appointments?date=YYYY-MM-DD (optional filter)
**Auth:** admin only
**Response 200:**
```json
{
  "appointments": [
    {
      "id": "uuid",
      "slot_date": "YYYY-MM-DD",
      "slot_start_time": "HH:MM",
      "slot_end_time": "HH:MM",
      "client_name": "string",
      "client_phone": "string",
      "notes": "string | null",
      "status": "confirmed | cancelled",
      "created_at": "ISO8601"
    }
  ]
}
```

### POST cancel appointment (admin)
**Server Action:** adminCancelAppointment(appointmentId)
**Auth:** admin only
**Response success:** `{ success: true }`

### POST create availability slots
**Server Action:** createAvailabilitySlots(data)
**Auth:** admin only
**Input:**
```ts
{
  date: string              // "YYYY-MM-DD"
  slots: Array<{
    start_time: string      // "HH:MM"
    end_time: string        // "HH:MM"
  }>
}
```
**Response success:** `{ created: number }` (count of slots created)
**Response error:** `{ error: "DUPLICATE_SLOT" | "PAST_DATE" | "VALIDATION_ERROR" }`

### DELETE availability slot
**Server Action:** deleteAvailabilitySlot(slotId)
**Auth:** admin only
**Validation:** Cannot delete a slot that has a confirmed appointment
**Response success:** `{ success: true }`
**Response error:** `{ error: "HAS_BOOKING" | "NOT_FOUND" }`

### POST bulk create slots for date
**Server Action:** bulkCreateSlots(data)
**Auth:** admin only
**Input:**
```ts
{
  date: string        // "YYYY-MM-DD"
  from_time: string   // "09:00"
  to_time: string     // "18:00"
  slot_duration: 30   // minutes, default 30
}
```
**Response success:** `{ created: number }`

### Gallery management

#### POST upload gallery image
**Route Handler:** POST /api/admin/gallery (multipart/form-data)
**Auth:** admin only
**Body:** FormData with `file` (image), optional `alt_text`, optional `display_order`
**Response 201:** `{ image: { id, url, alt_text, display_order } }`
**Response error:** `{ error: "INVALID_FILE" | "UPLOAD_FAILED" }`

#### DELETE gallery image
**Server Action:** deleteGalleryImage(imageId)
**Auth:** admin only
**Response success:** `{ success: true }` (also deletes from Supabase Storage)

#### PATCH reorder gallery images
**Server Action:** reorderGalleryImages(orderedIds: string[])
**Auth:** admin only
**Input:** array of image IDs in desired order
**Response success:** `{ success: true }`

---

## Shared TypeScript Types

```ts
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
```

## Error Format
All errors follow: `{ error: "ERROR_CODE", message?: "human readable" }`
