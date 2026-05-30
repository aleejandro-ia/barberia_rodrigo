# Data Model
Generated: 2026-05-29

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
Admin-defined open time slots per day. Rodrigo enables specific days and hours.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| date | date | NOT NULL | The specific calendar date |
| start_time | time | NOT NULL | e.g. '09:00' |
| end_time | time | NOT NULL | e.g. '09:30' (30min slots) |
| is_available | boolean | NOT NULL DEFAULT true | Admin can disable individual slots |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

UNIQUE(date, start_time)

### appointments
Client bookings linked to a slot and user.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE | Client who booked |
| slot_date | date | NOT NULL | Appointment date |
| slot_start_time | time | NOT NULL | Appointment start time |
| slot_end_time | time | NOT NULL | Appointment end time |
| client_name | text | NOT NULL | Name at booking time |
| client_phone | text | NOT NULL | Phone at booking time |
| notes | text | | Optional client notes |
| status | text | NOT NULL DEFAULT 'confirmed' | 'confirmed' | 'cancelled' |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

UNIQUE(slot_date, slot_start_time) — one booking per slot

## Relationships
- profiles belongs to auth.users via id (1:1)
- appointments has one profiles via user_id
- appointments references a slot by (slot_date, slot_start_time) — denormalized for simplicity

## Indexes
- availability_slots(date) — reason: admin and clients query by date frequently
- appointments(user_id) — reason: check active bookings per user for rate limiting
- appointments(slot_date, status) — reason: admin dashboard queries by date and status
- appointments(slot_date, slot_start_time) — reason: unique conflict check

## Supabase RLS Policies

### profiles
- SELECT: auth.uid() = id (own profile only) OR is_admin() (see admin function below)
- INSERT: auth.uid() = id (auto-created on first sign-in via trigger)
- UPDATE: auth.uid() = id

### gallery_images
- SELECT: public (everyone can view gallery)
- INSERT / UPDATE / DELETE: is_admin() only

### availability_slots
- SELECT: public (clients need to see open slots)
- INSERT / UPDATE / DELETE: is_admin() only

### appointments
- SELECT: auth.uid() = user_id (own appointments) OR is_admin()
- INSERT: authenticated users (with check: only 1 active booking per user)
- UPDATE: is_admin() only (admin cancels) OR auth.uid() = user_id AND status = 'confirmed' (client cancels own)
- DELETE: is_admin() only

## Helper function
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'email' = current_setting('app.admin_email', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Admin email is set via Supabase env / app.settings.

## Supabase Storage
Bucket: `gallery` (public)
- Path pattern: `gallery/{uuid}.{ext}`
- Max file size: 10MB
- Allowed MIME types: image/jpeg, image/png, image/webp

## Notes
- availability_slots are created by admin per day. Clients see only slots where is_available=true AND no confirmed appointment exists.
- 30-minute slot duration is the default. Admin creates slots individually or via bulk generation (e.g., every 30min from 09:00 to 18:00 for a specific date).
- No recurring schedule table — admin creates slots per specific date. This gives maximum flexibility (Rodrigo said he works Thursday/Friday usually but wants to add any day).
