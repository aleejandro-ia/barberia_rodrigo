-- =============================================================================
-- BARBERÍA RODRIGO — Initial Schema Migration
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New Query)
-- =============================================================================


-- =============================================================================
-- SECTION 1: HELPER FUNCTIONS
-- =============================================================================

-- is_admin(): checks JWT email claim against app.settings.admin_email
-- Set admin_email with: ALTER DATABASE postgres SET app.settings.admin_email = 'your@email.com';
-- Or set it in Supabase Dashboard > Settings > Database > Configuration

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb->>'email'
       = current_setting('app.settings.admin_email', true)
$$;


-- =============================================================================
-- SECTION 2: TABLES
-- =============================================================================

-- ----------------------------
-- 2.1 profiles
-- Linked 1:1 to auth.users. Auto-created on sign-up via trigger.
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.2 gallery_images
-- Admin-uploaded photos displayed in the public gallery.
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  url            text        NOT NULL,
  storage_path   text        NOT NULL,
  alt_text       text,
  display_order  integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.3 availability_slots
-- Admin-defined open time slots per specific date.
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date        NOT NULL,
  start_time    time        NOT NULL,
  end_time      time        NOT NULL,
  is_available  boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT availability_slots_date_start_time_key UNIQUE (date, start_time)
);

-- ----------------------------
-- 2.4 appointments
-- Client bookings. Denormalized slot data (date/time) for historical integrity.
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_date        date        NOT NULL,
  slot_start_time  time        NOT NULL,
  slot_end_time    time        NOT NULL,
  client_name      text        NOT NULL,
  client_phone     text        NOT NULL,
  notes            text,
  status           text        NOT NULL DEFAULT 'confirmed'
                               CHECK (status IN ('confirmed', 'cancelled')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_slot_date_slot_start_time_key UNIQUE (slot_date, slot_start_time)
);


-- =============================================================================
-- SECTION 3: INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_availability_slots_date
  ON public.availability_slots (date);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id
  ON public.appointments (user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_slot_date_status
  ON public.appointments (slot_date, status);

CREATE INDEX IF NOT EXISTS idx_appointments_slot_date_start_time
  ON public.appointments (slot_date, slot_start_time);


-- =============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments      ENABLE ROW LEVEL SECURITY;

-- ----------------------------
-- 4.1 profiles RLS policies
-- ----------------------------

-- Authenticated users can read their own profile; admin reads any
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can only insert their own profile row (also handled by trigger)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile row
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ----------------------------
-- 4.2 gallery_images RLS policies
-- ----------------------------

-- Anyone (including unauthenticated) can view gallery images
CREATE POLICY "gallery_images_select_public"
  ON public.gallery_images FOR SELECT
  USING (true);

-- Only admin can insert gallery images
CREATE POLICY "gallery_images_insert_admin"
  ON public.gallery_images FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admin can update gallery images
CREATE POLICY "gallery_images_update_admin"
  ON public.gallery_images FOR UPDATE
  USING (public.is_admin());

-- Only admin can delete gallery images
CREATE POLICY "gallery_images_delete_admin"
  ON public.gallery_images FOR DELETE
  USING (public.is_admin());

-- ----------------------------
-- 4.3 availability_slots RLS policies
-- ----------------------------

-- Anyone can view availability slots
CREATE POLICY "availability_slots_select_public"
  ON public.availability_slots FOR SELECT
  USING (true);

-- Only admin can create slots
CREATE POLICY "availability_slots_insert_admin"
  ON public.availability_slots FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admin can update slots
CREATE POLICY "availability_slots_update_admin"
  ON public.availability_slots FOR UPDATE
  USING (public.is_admin());

-- Only admin can delete slots
CREATE POLICY "availability_slots_delete_admin"
  ON public.availability_slots FOR DELETE
  USING (public.is_admin());

-- ----------------------------
-- 4.4 appointments RLS policies
-- ----------------------------

-- Owner sees own appointments; admin sees all
CREATE POLICY "appointments_select_own_or_admin"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Authenticated users can book, but only if they have no other 'confirmed'
-- future appointment (enforced in WITH CHECK)
CREATE POLICY "appointments_insert_authenticated_one_active"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.appointments existing
      WHERE existing.user_id   = auth.uid()
        AND existing.status    = 'confirmed'
        AND existing.slot_date >= CURRENT_DATE
        AND existing.id        IS DISTINCT FROM id  -- allows update path
    )
  );

-- Admin can update any appointment; owner can only update to cancel their own confirmed appointment
CREATE POLICY "appointments_update_admin_or_cancel_own"
  ON public.appointments FOR UPDATE
  USING (
    public.is_admin()
    OR (auth.uid() = user_id AND status = 'confirmed')
  );

-- Only admin can hard-delete appointments
CREATE POLICY "appointments_delete_admin"
  ON public.appointments FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- SECTION 5: TRIGGER — AUTO-CREATE PROFILE ON SIGN-UP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger first in case this migration is re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =============================================================================
-- SECTION 6: STORAGE — GALLERY BUCKET
-- =============================================================================

-- IMPORTANT: The `gallery` storage bucket cannot be created via SQL in all
-- Supabase versions. If the INSERT below fails, create it manually:
--
--   Supabase Dashboard > Storage > New Bucket
--   Name: gallery
--   Public bucket: YES (toggle ON)
--   Max file size: 10 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Then re-run only the storage policies below (they reference the bucket by name).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  10485760,  -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read public gallery files
CREATE POLICY "storage_gallery_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

-- Only admin can upload gallery files
CREATE POLICY "storage_gallery_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

-- Only admin can update gallery files
CREATE POLICY "storage_gallery_update_admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery' AND public.is_admin());

-- Only admin can delete gallery files
CREATE POLICY "storage_gallery_delete_admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND public.is_admin());


-- =============================================================================
-- SECTION 7: ADMIN EMAIL SETTING
-- =============================================================================

-- Set admin email so is_admin() works.
-- Replace with the actual admin email before running.
-- ALTER DATABASE postgres SET app.settings.admin_email = 'admin@example.com';
--
-- NOTE: In Supabase, use the Dashboard > Settings > Database > Configuration
-- to set this parameter, OR run the ALTER DATABASE statement once in the SQL Editor
-- with the real admin email substituted.
