# API Contracts
Generated: 2026-05-31 (updated — Fase 2 additions marked NEW)

## Architecture Note
Next.js App Router. Mutations via Server Actions. Queries via Route Handlers.

## Authentication
- Client routes: Supabase session cookie (getUser() from lib/auth.ts)
- Admin routes: Supabase session + isAdmin() check
- Cron route: Authorization: Bearer ${CRON_SECRET}

---

## Route Handlers

### GET /api/availability/dates
Returns dates with ≥1 free slot. Auth: none.
Response 200: { dates: string[] }

### GET /api/availability/slots?date=YYYY-MM-DD
Auth: none.
Response 200: { slots: { id, start_time, end_time }[] }

### GET /api/appointments/mine (MODIFIED)
All appointments for authenticated user. Auth: required.
Response 200: { appointments: Appointment[] } — full fields including new trazabilidad fields
Response 401: { error: "Unauthorized" }

### GET /api/gallery | GET /api/settings | GET /api/before-after
Unchanged. Auth: none.

### GET /api/admin/appointments | GET /api/admin/agenda?from&to
Unchanged. Auth: admin.

---

### GET /api/services (NEW)
Active services for booking dropdown. Auth: none.
Response 200: { services: { id, name, price_eur, duration_minutes, display_order }[] }
Filtered: is_active = true, ordered by display_order ASC.

### GET /api/admin/services (NEW)
All services including inactive. Auth: admin.
Response 200: { services: Service[] }

### POST /api/admin/services (NEW)
Create service. Auth: admin.
Body: { name: string, price_eur: number, duration_minutes?: number, display_order?: number }
Response 201: { service: Service }
Response 400: { error: "VALIDATION_ERROR" }

### PATCH /api/admin/services/[id] (NEW)
Update service. Auth: admin.
Body: partial Service fields.
Response 200: { service: Service }
Response 404: { error: "NOT_FOUND" }

### DELETE /api/admin/services/[id] (NEW)
Delete service. Auth: admin.
Response 200: { success: true }

### GET /api/admin/client-history?phone=XXXXXXXXX (NEW)
Appointment history by phone. Auth: admin.
Response 200:
{ appointments: Appointment[], stats: { total, completed, cancelled, noShow, lastVisit: string|null } }
Response 400: { error: "MISSING_PHONE" }

### GET /api/admin/metrics (NEW)
Operational metrics. Auth: admin.
Response 200:
{ today: { confirmed, completed, noShow }, thisWeek: { confirmed, completed, cancelled, noShow }, upcoming7days: number, freeSlots7days: number, occupancyRate: number, topClients: { name, phone, count }[] }

### GET /api/admin/status (NEW)
Connection status of optional services. Auth: admin.
Response 200:
{ resend: boolean, cron: boolean, serviceRole: boolean, bookingsEnabled: boolean, remindersEnabled: boolean }
Logic: SERVER-SIDE only — checks !!process.env.RESEND_API_KEY, !!process.env.CRON_SECRET, !!process.env.SUPABASE_SERVICE_ROLE_KEY + reads booking_settings bookings_enabled/reminders_enabled.
Never expose actual key values.

### GET /api/cron/reminders (NEW)
Processes reminder emails. Auth: Bearer CRON_SECRET.
Logic: find confirmed appointments in 24h/2h windows with reminder_*_sent_at IS NULL → send email → mark sent.
Response 200: { processed24h: number, processed2h: number }
Response 401: { error: "Unauthorized" }

---

## Server Actions

### bookAppointment(data) — MODIFIED
New errors: BOOKINGS_DISABLED | TOO_SOON
Removed: ALREADY_HAS_BOOKING (multiple bookings now allowed with UI warning)

### cancelAppointment(appointmentId) — MODIFIED
New: validates cancel_hours_before, sets cancelled_by_client + cancelled_at, sends email.
New error: CANCEL_TOO_LATE

### rescheduleAppointment(appointmentId, newSlot) — NEW
Validates ownership, confirmed status, time window, new slot availability.
UPDATE in-place. Resets reminder fields.
Errors: UNAUTHORIZED | NOT_FOUND | NOT_OWNER | NOT_CONFIRMED | RESCHEDULE_TOO_LATE | SLOT_NOT_FOUND | SLOT_TAKEN | VALIDATION_ERROR

### adminCancelAppointment(appointmentId) — MODIFIED
Now sets cancelled_by_admin + cancelled_at + sends email to client.

### adminRescheduleAppointment(appointmentId, newSlot) — NEW
No time restriction. Sends reschedule notification email. Resets reminder fields.
Errors: UNAUTHORIZED | NOT_FOUND | NOT_CONFIRMED | SLOT_TAKEN

### adminMarkNoShow(appointmentId) — NEW
Sets no_show. Confirmed only.
Errors: UNAUTHORIZED | NOT_FOUND | NOT_CONFIRMED

### adminMarkCompleted(appointmentId) — NEW
Sets completed + completed_at. Confirmed only.
Errors: UNAUTHORIZED | NOT_FOUND | NOT_CONFIRMED

### adminCopyWeekToNext(weekStart) — NEW
Copies slots +7 days. ON CONFLICT DO NOTHING.
Returns: { created: number, skipped: number }

### adminCreateService / adminUpdateService / adminDeleteService — NEW
CRUD for services table. Admin only.

### getBookingSettings() / updateBookingSetting(key, value) — NEW
Read/write booking_settings. getBookingSettings() is public. updateBookingSetting() admin only.

---

## Shared TypeScript types

```typescript
type AppointmentStatus =
  | 'confirmed' | 'cancelled' | 'cancelled_by_client'
  | 'cancelled_by_admin' | 'rescheduled' | 'completed' | 'no_show'

interface Appointment {
  id: string; user_id?: string | null
  slot_date: string; slot_start_time: string; slot_end_time: string
  client_name: string; client_phone: string; notes?: string
  status: AppointmentStatus; created_at: string
  cancelled_at?: string | null; rescheduled_at?: string | null
  previous_slot_date?: string | null; completed_at?: string | null
  reminder_24h_sent_at?: string | null; reminder_2h_sent_at?: string | null
}

interface Service {
  id: string; name: string; price_eur: number
  duration_minutes: number; is_active: boolean; display_order: number
}

interface BookingSettings {
  cancel_hours_before: number; reschedule_hours_before: number
  advance_booking_days: number; min_hours_advance: number
  whatsapp_phone: string; business_name: string; business_location: string
  whatsapp_cancel_msg: string; whatsapp_reschedule_msg: string
  reminders_enabled: boolean; reminder_24h_enabled: boolean
  reminder_2h_enabled: boolean; bookings_enabled: boolean
}
```

## Error format
All errors: { error: "ERROR_CODE" }
All successes: { success: true } or { data/service/appointment: ... }
