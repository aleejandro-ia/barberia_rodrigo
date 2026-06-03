-- 008: servicios editables desde panel + visibilidad landing/reserva
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS show_in_landing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_booking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS icon_key text NOT NULL DEFAULT 'scissors';

-- paridad con comportamiento previo (filtro reserva usaba is_active)
UPDATE public.services SET show_in_booking = is_active;

-- semilla: descripciones + iconos de los 3 servicios hardcodeados originales
UPDATE public.services SET description = 'El clásico de siempre. Lo que funciona, funciona.', icon_key = 'comb'
  WHERE name = 'Corte Clásico' AND description IS NULL;
UPDATE public.services SET description = 'Adaptado a lo que llevas o a lo que quieres empezar a llevar.', icon_key = 'scissors'
  WHERE name = 'Corte' AND description IS NULL;
UPDATE public.services SET description = 'El corte y el arreglo de barba. Todo en una visita.', icon_key = 'razor'
  WHERE name = 'Corte con Barba' AND description IS NULL;
