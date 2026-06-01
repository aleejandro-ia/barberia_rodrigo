-- Migration 005: barbers table + barber_id on appointments + availability_slots

-- 1. Tabla barbers
CREATE TABLE public.barbers (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  title         text NOT NULL DEFAULT 'Barbero',
  photo_url     text,
  is_active     boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Insertar Rodrigo como barbero default
INSERT INTO public.barbers (name, title, display_order)
VALUES ('Rodrigo Bargueño', 'Maestro Barbero', 0);

-- 3. Añadir barber_id a appointments (nullable — existentes quedan null = Rodrigo)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES public.barbers(id) ON DELETE SET NULL;

-- 4. Añadir barber_id a availability_slots (nullable — existentes quedan null = cualquier barbero)
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES public.barbers(id) ON DELETE SET NULL;

-- 5. RLS en barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barbers_select_public"
  ON public.barbers FOR SELECT
  USING (true);

CREATE POLICY "barbers_all_admin"
  ON public.barbers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
