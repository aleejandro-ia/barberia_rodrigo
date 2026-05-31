-- ============================================================
-- BARBERÍA BG BARBER — Migration 004: Fix RLS UPDATE policy
-- ============================================================
--
-- Problema: la policy original no tenía WITH CHECK explícito.
-- PostgreSQL hereda USING como WITH CHECK para UPDATE.
-- Efecto: al cambiar status a 'cancelled_by_client' la fila
-- resultante falla la condición `status = 'confirmed'` → UPDATE
-- bloqueado silenciosamente → action devuelve success pero DB no cambia.
--
-- Fix: WITH CHECK separado que solo verifica propiedad del usuario,
-- sin restricción sobre el status resultante.
-- ============================================================

DROP POLICY IF EXISTS "appointments_update_admin_or_cancel_own" ON public.appointments;

CREATE POLICY "appointments_update_admin_or_cancel_own"
  ON public.appointments FOR UPDATE
  USING (
    -- Solo filas confirmed del propio usuario (o cualquier fila si es admin)
    public.is_admin()
    OR (auth.uid() = user_id AND status = 'confirmed')
  )
  WITH CHECK (
    -- Post-update: solo verificar propiedad (no el status resultante)
    public.is_admin()
    OR auth.uid() = user_id
  );
