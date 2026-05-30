-- =============================================================================
-- BARBERÍA RODRIGO — Seed Data
-- Run AFTER 001_initial_schema.sql
-- Provides test availability slots for local/staging testing.
-- =============================================================================

-- =============================================================================
-- availability_slots: Thursday 2026-06-05, 09:00–13:00, 30-min slots
-- =============================================================================
INSERT INTO public.availability_slots (date, start_time, end_time, is_available) VALUES
  ('2026-06-05', '09:00', '09:30', true),
  ('2026-06-05', '09:30', '10:00', true),
  ('2026-06-05', '10:00', '10:30', true),
  ('2026-06-05', '10:30', '11:00', true),
  ('2026-06-05', '11:00', '11:30', true),
  ('2026-06-05', '11:30', '12:00', true),
  ('2026-06-05', '12:00', '12:30', true),
  ('2026-06-05', '12:30', '13:00', true)
ON CONFLICT (date, start_time) DO NOTHING;

-- =============================================================================
-- availability_slots: Friday 2026-06-06, 09:00–13:00, 30-min slots
-- =============================================================================
INSERT INTO public.availability_slots (date, start_time, end_time, is_available) VALUES
  ('2026-06-06', '09:00', '09:30', true),
  ('2026-06-06', '09:30', '10:00', true),
  ('2026-06-06', '10:00', '10:30', true),
  ('2026-06-06', '10:30', '11:00', true),
  ('2026-06-06', '11:00', '11:30', true),
  ('2026-06-06', '11:30', '12:00', true),
  ('2026-06-06', '12:00', '12:30', true),
  ('2026-06-06', '12:30', '13:00', true)
ON CONFLICT (date, start_time) DO NOTHING;

-- =============================================================================
-- NOTE: appointments and profiles require real auth.users rows.
-- To test appointments, sign up a user via the app first, then insert manually:
--
-- INSERT INTO public.appointments (user_id, slot_date, slot_start_time, slot_end_time, client_name, client_phone, status)
-- VALUES (
--   '<your-auth-user-uuid>',
--   '2026-06-05',
--   '09:00',
--   '09:30',
--   'Test Client',
--   '+502 5555-1234',
--   'confirmed'
-- );
-- =============================================================================
