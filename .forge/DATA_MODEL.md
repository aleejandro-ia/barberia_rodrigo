# Data Model
Generated: 2026-05-31 (updated — Fase 2)

## Entities

### profiles
Linked to auth.users. Stores public client info.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Same as auth user id |
| full_name | text | | Client display name |
| phone | text | | Verified phone (from Supabase auth metadata) |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

### gallery_images
Photos uploaded by admin shown in public gallery.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| url | text | NOT NULL | Supabase Storage public URL |
| storage_path | text | NOT NULL | Internal storage path for deletion |
| alt_text | text | | Accessibility description |
| display_order | integer | NOT NULL DEFAULT 0 | Sort order in gallery |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

### availability_slots
Admin-defined open time slots per day.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| date | date | NOT NULL | The specific calendar date |
| start_time | time | NOT NULL | e.g. '09:00' |
| end_time | time | NOT NULL | e.g. '09:30' |
| is_available | boolean | NOT NULL DEFAULT true | false = blocked by admin |
| blocked_reason | text | | Optional reason for blocking (migration 002) |
| updated_at | timestamptz | NOT NULL DEFAULT now() | Auto-updated by trigger (migration 002) |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

UNIQUE(date, start_time)

### appointments
Client bookings. Denormalized slot data for historical integrity.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| user_id | uuid | NULLABLE REFERENCES profiles(id) ON DELETE CASCADE | null = admin walk-in (migration 002) |
| slot_date | date | NOT NULL | Appointment date |
| slot_start_time | time | NOT NULL | Appointment start time |
| slot_end_time | time | NOT NULL | Appointment end time |
| client_name | text | NOT NULL | Name at booking time |
| client_phone | text | NOT NULL | Phone at booking time |
| notes | text | | Service selected or free text notes |
| status | text | NOT NULL DEFAULT 'confirmed' | See status enum below |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| cancelled_at | timestamptz | NULLABLE | When cancelled (migration 003) |
| cancellation_reason | text | NULLABLE | Optional reason (migration 003) |
| rescheduled_at | timestamptz | NULLABLE | When last rescheduled (migration 003) |
| previous_slot_date | date | NULLABLE | Slot before last reschedule (migration 003) |
| previous_slot_start_time | time | NULLABLE | Time before last reschedule (migration 003) |
| completed_at | timestamptz | NULLABLE | When marked completed (migration 003) |
| reminder_24h_sent_at | timestamptz | NULLABLE | Anti-duplicate for cron (migration 003) |
| reminder_2h_sent_at | timestamptz | NULLABLE | Anti-duplicate for cron (migration 003) |

**Status enum:** confirmed | cancelled | cancelled_by_client | cancelled_by_admin | rescheduled | completed | no_show
Note: 'cancelled' preserved for backwards compatibility with existing rows.
Note: 'rescheduled' reserved for future use — current impl uses UPDATE in-place, status stays 'confirmed'.

**Unique constraint:** PARTIAL UNIQUE INDEX on (slot_date, slot_start_time) WHERE status = 'confirmed'
(migration 002 replaced broad UNIQUE with this partial index)

### booking_settings
Configurable rules per business instance. Key-value store.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| key | text | PRIMARY KEY | Setting identifier |
| value | text | NOT NULL | Setting value (always text, parsed in app) |
| description | text | | Human-readable description |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

**Default keys:**
| key | default | type |
|---|---|---|
| cancel_hours_before | 3 | integer |
| reschedule_hours_before | 3 | integer |
| advance_booking_days | 90 | integer |
| min_hours_advance | 2 | integer |
| whatsapp_phone | 34600000000 | string |
| business_name | BG Barber | string |
| business_location | (empty) | string |
| whatsapp_cancel_msg | ... | string |
| whatsapp_reschedule_msg | ... | string |
| reminders_enabled | true | boolean |
| reminder_24h_enabled | true | boolean |
| reminder_2h_enabled | true | boolean |
| bookings_enabled | true | boolean |

### services
Configurable service catalog per business instance.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | Service display name |
| price_eur | numeric(6,2) | NOT NULL DEFAULT 0 | Price in euros |
| duration_minutes | integer | NOT NULL DEFAULT 30 | Informational only |
| is_active | boolean | NOT NULL DEFAULT true | Hidden from booking if false |
| display_order | integer | NOT NULL DEFAULT 0 | Sort order in dropdown |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

Note: services.name is stored as text in appointments.notes — no FK. Backwards compatible.
Default seed: Corte Clásico (7€), Corte (9€), Corte con Barba (10€).

### site_settings
Existing table (not changed in this phase). Key-value for site images and section toggles.

## Relationships
- profiles belongs to auth.users via id (1:1)
- appointments has one profiles via user_id (nullable — walk-ins have user_id null)
- appointments references slot by (slot_date, slot_start_time) — denormalized
- booking_settings is standalone key-value (no FK)
- services is standalone (no FK to appointments — name stored as text in notes)

## Indexes
- idx_appointments_user_id — appointments(user_id) — query client's own appointments
- idx_appointments_slot_date_status — appointments(slot_date, status) — admin queries
- idx_appointments_slot_date_start_time — appointments(slot_date, slot_start_time) — availability check
- idx_appointments_user_status_date — appointments(user_id, status, slot_date) — Mis citas queries (NEW)
- idx_appointments_reminders — appointments(slot_date, slot_start_time, status) WHERE status='confirmed' AND reminder_24h_sent_at IS NULL — cron queries (NEW)
- idx_availability_slots_date — availability_slots(date) — week fetch
- appointments_slot_unique_confirmed — PARTIAL UNIQUE on (slot_date, slot_start_time) WHERE status='confirmed'

## RLS Summary
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | own or admin | own | own | — |
| gallery_images | public | admin | admin | admin |
| availability_slots | public | admin | admin | admin |
| appointments | own or admin | authenticated (own) + admin (null user_id) | admin or own-confirmed | admin |
| booking_settings | public | admin | admin | — |
| services | public | admin | admin | admin |
| site_settings | public | admin | admin | — |

Note: 'own' in appointments SELECT handles user_id IS NULL (admin walk-ins visible only to admin).
