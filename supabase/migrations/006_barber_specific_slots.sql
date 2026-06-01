-- Migration 006: Per-barber availability slots
-- Run in Supabase SQL Editor

-- 1. Migrate all null barber_id slots → Rodrigo (first barber by display_order)
UPDATE public.availability_slots
SET barber_id = (
  SELECT id FROM public.barbers ORDER BY display_order ASC LIMIT 1
)
WHERE barber_id IS NULL;

-- 2. Drop old unique constraint (date, start_time) — invalid now that barbers share time slots
ALTER TABLE public.availability_slots
  DROP CONSTRAINT IF EXISTS availability_slots_date_start_time_key;

-- 3. New unique constraint includes barber_id — two barbers CAN work the same hour
ALTER TABLE public.availability_slots
  ADD CONSTRAINT availability_slots_date_start_time_barber_key
  UNIQUE (date, start_time, barber_id);

-- 4. Migrate null barber_id on appointments → Rodrigo (backward compat)
UPDATE public.appointments
SET barber_id = (
  SELECT id FROM public.barbers ORDER BY display_order ASC LIMIT 1
)
WHERE barber_id IS NULL;
