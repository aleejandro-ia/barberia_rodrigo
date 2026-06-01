-- 007_confirmed_unique_per_barber.sql
-- Fix: the confirmed-appointment unique index was scoped to (slot_date, slot_start_time)
-- only, which allowed just ONE confirmed appointment per timeslot across the WHOLE shop.
-- With multiple barbers, two barbers must be able to hold the same timeslot independently.
-- Re-create the index including barber_id so the uniqueness is per-barber, while still
-- preventing double-booking of the same barber at the same slot.

DROP INDEX IF EXISTS public.appointments_slot_unique_confirmed;

CREATE UNIQUE INDEX appointments_slot_unique_confirmed
  ON public.appointments (slot_date, slot_start_time, barber_id)
  WHERE status = 'confirmed';
