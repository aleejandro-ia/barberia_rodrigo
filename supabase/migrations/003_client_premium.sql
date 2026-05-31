-- ============================================================
-- BARBERÍA BG BARBER — Migration 003: Client Premium + SaaS
-- ============================================================

-- 1. Expandir CHECK constraint de status
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'confirmed',
    'cancelled',
    'cancelled_by_client',
    'cancelled_by_admin',
    'rescheduled',
    'completed',
    'no_show'
  ));

-- 2. Campos de trazabilidad en appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_at               timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason        text,
  ADD COLUMN IF NOT EXISTS rescheduled_at             timestamptz,
  ADD COLUMN IF NOT EXISTS previous_slot_date         date,
  ADD COLUMN IF NOT EXISTS previous_slot_start_time   time,
  ADD COLUMN IF NOT EXISTS completed_at               timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at       timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at        timestamptz;

-- 3. Tabla booking_settings (reglas configurables por negocio)
CREATE TABLE IF NOT EXISTS public.booking_settings (
  key         text        PRIMARY KEY,
  value       text        NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.booking_settings (key, value, description) VALUES
  ('cancel_hours_before',     '3',   'Horas mínimas antes de la cita para cancelar online'),
  ('reschedule_hours_before', '3',   'Horas mínimas antes de la cita para reprogramar online'),
  ('advance_booking_days',    '90',  'Máximo días adelante que se puede reservar'),
  ('min_hours_advance',       '2',   'Horas mínimas de antelación para reservar'),
  ('whatsapp_phone',          '34600000000', 'Teléfono WhatsApp barbero (con prefijo país, sin +)'),
  ('business_name',           'BG Barber', 'Nombre del negocio'),
  ('business_location',       '',    'Dirección del negocio'),
  ('whatsapp_cancel_msg',     'Hola, necesito cancelar mi cita pero está fuera del plazo online. ¿Me puedes ayudar?', 'Mensaje WA cancelación fuera de plazo'),
  ('whatsapp_reschedule_msg', 'Hola, me gustaría cambiar mi cita. ¿Tienes disponibilidad?', 'Mensaje WA reprogramación fuera de plazo'),
  ('reminders_enabled',       'true', 'Activar recordatorios automáticos por email'),
  ('reminder_24h_enabled',    'true', 'Recordatorio 24h antes'),
  ('reminder_2h_enabled',     'true', 'Recordatorio 2h antes'),
  ('bookings_enabled',        'true', 'Activar/pausar reservas online globalmente')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_settings_select_public"
  ON public.booking_settings FOR SELECT USING (true);

CREATE POLICY "booking_settings_insert_admin"
  ON public.booking_settings FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "booking_settings_update_admin"
  ON public.booking_settings FOR UPDATE USING (public.is_admin());

-- 4. Tabla services (catálogo configurable)
CREATE TABLE IF NOT EXISTS public.services (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  price_eur        numeric(6,2) NOT NULL DEFAULT 0,
  duration_minutes integer     NOT NULL DEFAULT 30,
  is_active        boolean     NOT NULL DEFAULT true,
  display_order    integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.services (name, price_eur, duration_minutes, display_order) VALUES
  ('Corte Clásico', 7.00,  30, 1),
  ('Corte',         9.00,  30, 2),
  ('Corte con Barba', 10.00, 45, 3)
ON CONFLICT DO NOTHING;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_public"
  ON public.services FOR SELECT USING (true);

CREATE POLICY "services_insert_admin"
  ON public.services FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "services_update_admin"
  ON public.services FOR UPDATE USING (public.is_admin());

CREATE POLICY "services_delete_admin"
  ON public.services FOR DELETE USING (public.is_admin());

-- 5. Eliminar RLS policy de 1 cita activa por usuario
DROP POLICY IF EXISTS "appointments_insert_authenticated_one_active"
  ON public.appointments;

CREATE POLICY "appointments_insert_authenticated"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- 6. Índices nuevos
CREATE INDEX IF NOT EXISTS idx_appointments_user_status_date
  ON public.appointments (user_id, status, slot_date);

CREATE INDEX IF NOT EXISTS idx_appointments_reminders
  ON public.appointments (slot_date, slot_start_time, status)
  WHERE status = 'confirmed';
