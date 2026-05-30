-- =============================================================================
-- BARBERÍA RODRIGO — Agenda Phase 1 Migration
-- Applied: 2026-05-30
-- =============================================================================

-- 1. Añadir campos a availability_slots
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Hacer user_id nullable (admin puede crear citas sin cuenta de cliente)
ALTER TABLE public.appointments
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Eliminar unique constraint que bloquea re-reservar slots cancelados
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_slot_date_slot_start_time_key;

-- 4. Reemplazar con partial unique index: solo 1 cita CONFIRMED por slot
CREATE UNIQUE INDEX IF NOT EXISTS appointments_slot_unique_confirmed
  ON public.appointments (slot_date, slot_start_time)
  WHERE status = 'confirmed';

-- 5. Trigger para updated_at automático en availability_slots
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS set_availability_slots_updated_at ON public.availability_slots;
CREATE TRIGGER set_availability_slots_updated_at
  BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Nueva política RLS: admin puede insertar citas (incluido user_id null)
DROP POLICY IF EXISTS "appointments_insert_admin" ON public.appointments;
CREATE POLICY "appointments_insert_admin"
  ON public.appointments FOR INSERT
  WITH CHECK (public.is_admin());

-- 7. Actualizar política SELECT para ver citas con user_id null (admin walk-ins)
DROP POLICY IF EXISTS "appointments_select_own_or_admin" ON public.appointments;
CREATE POLICY "appointments_select_own_or_admin"
  ON public.appointments FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );
