# Decision Record
<!-- Updated by forge:sync — do not edit manually -->

[2026-05-29] Next.js 15 App Router + Supabase chosen as stack — Reason: Vercel-native, minimal config, Supabase handles auth+db+storage in one service with generous free tier. Fastest path to ship.

[2026-05-29] Admin identified by ADMIN_EMAIL env var + RLS helper function — Reason: Single admin (Rodrigo), no need for admin_users table or role system. Simplest secure approach.

[2026-05-29] Phone OTP + Google OAuth for clients (not just Google) — Reason: User explicitly wanted phone verification. Phone number is harder to fake than email, deters no-show abuse. Supabase supports both natively.

[2026-05-29] Per-date availability slots (not recurring weekly schedule) — Reason: Rodrigo works flexible days (mainly Thu/Fri but wants to add any day). A recurring template would need override logic. Per-date slots are more explicit and flexible. Admin creates slots for each specific date he wants to work.

[2026-05-29] Bulk slot generator in admin (from_time to to_time every 30min) — Reason: Creating 30-minute slots one by one for a full day would be tedious. Bulk generator makes it practical.

[2026-05-29] 1 active booking per user rate limit — Reason: Anti-spam. Prevents one person from blocking all slots. Client can only have 1 confirmed future appointment at a time.

[2026-05-29] Supabase Storage for gallery images — Reason: Integrated with Supabase, RLS-protected uploads, public read URLs. No additional service needed.

[2026-05-29] design-taste-frontend + high-end-visual-design skills for public landing — Reason: User wants "premium/luxury feel". These skills specifically prevent LLM design slop and enforce agency-tier output quality.

[2026-05-29] Admin panel uses shadcn/ui (functional, not taste-skill aesthetic) — Reason: Admin panel is a utility tool for Rodrigo only. Premium aesthetic adds complexity without value here. shadcn/ui gives solid, accessible, professional admin UI fast.

[2026-05-30] Warm dark palette para admin también (#0E0B08, #161310, #C9A96E) — Reason: Usuario pidió admin más premium. Mantener coherencia visual con el landing.

[2026-05-30] Plus Jakarta Sans reemplaza Outfit como fuente principal — Reason: Outfit weight 300 se pixelaba en fondos oscuros. Plus Jakarta Sans tiene mejor hinting, optical corrections built-in, rendering limpio a todos los tamaños.

[2026-05-30] font-size base HTML = 17px (no 16px Tailwind default) — Reason: Todo el texto se veía pequeño. 17px da más presencia sin romper layouts. Escala todos los rem automáticamente.

[2026-05-30] site_settings tabla con keys fijas vs columnas dinámicas — Reason: Solo 2 imágenes configurables (hero + portrait). Keys fijas + upsert es más simple que schema dinámico. Fácil de extender añadiendo más keys.

[2026-05-30] Google OAuth ONLY (eliminado phone OTP) — Reason: Usuario confirmó que solo quiere Google OAuth. Phone OTP con Twilio añade coste y complejidad innecesaria para este caso.

[2026-05-31] UPDATE in-place para reprogramación de citas — Reason: RLS INSERT policy bloquea nueva cita confirmed si ya existe una activa. UPDATE evita el conflicto y libera el slot viejo automáticamente. Trazabilidad via previous_slot_date + rescheduled_at.

[2026-05-31] booking_settings como key-value store (no columnas fijas) — Reason: Permite añadir nuevas configuraciones sin migration. Base para multi-tenant futuro donde cada negocio tiene sus propios valores.

[2026-05-31] services.name guardado como text en appointments.notes (sin FK) — Reason: Backwards compatible con citas existentes. Walk-ins pueden tener notas libres. Sin migration de datos históricos.

[2026-05-31] Email con graceful degradation — Reason: Booking no debe fallar si email falla. Todas las funciones comprueban RESEND_API_KEY; sin ella hacen console.warn + return {skipped:true}. Sistema funcional sin email.

[2026-05-31] ALREADY_HAS_BOOKING eliminado — múltiples citas permitidas con warning UI — Reason: Un cliente puede querer reservar para varios días. El bloqueo server era demasiado restrictivo para un negocio real. Warning en UI es suficiente.

[2026-05-31] /api/admin/status retorna booleans only, nunca raw env vars — Reason: Seguridad. El cliente necesita saber si Resend está configurado pero nunca debe ver la API key.

[2026-05-30] GitHub auto-deploy via Vercel Git Integration (no Vercel CLI) — Reason: Vercel CLI token expirado y no instalado localmente. Git integration es más limpio: push a main = deploy automático sin CLI.

[2026-05-30] Admin button en NavBar vía fetch /api/auth/is-admin — Reason: Check server-side del rol. No expone lógica de admin al cliente. NavBar es 'use client' así que no puede usar server actions directamente.

[2026-05-30] Gallery: 3D circular carousel en lugar de grid estático — Reason: Usuario quería carrusel tipo circular 3D. Grid era demasiado estático para sección de trabajos premium.

[2026-05-30] Carousel usa useRef para rotación, no useState — Reason: useState re-renderiza React tree a 60fps. useRef + direct DOM style = 0 re-renders, performante en mobile.

[2026-05-30] window.addEventListener scroll eliminado del carousel — Reason: Activaba en toda la página, no solo en la sección galería. Jank y UX confusa. Reemplazado por auto-rotate + drag.

[2026-05-30] Responsive carousel: 3D en md (768px+), flat scroll-snap en mobile — Reason: 3D con perspective en mobile es difícil de interactuar. Flat scroll-snap es nativo, rápido y familiar en móvil.

[2026-05-30] Gallery carousel: infinite marquee belt (no slide-by-slide, no 3D circular) — Reason: Usuario quería movimiento continuo tipo cinta transportadora. Marquee con triple array + seamless reset más limpio que 3D. Sin CSS preserve-3d issues.

[2026-05-30] sessionStorage para pending slot durante OAuth redirect — Reason: React state no sobrevive full-page redirect de Google OAuth. sessionStorage persiste entre redirects. Clave 'bgbarber_pending_booking'.

[2026-05-30] BookingSection step machine ('date'|'slot'|'form'|'confirmed'|'blocked') — Reason: Renderizado condicional complejo antes era difícil de mantener. Step machine hace el flujo explícito y testeable. Mobile usa step-by-step, desktop usa 2-col.

[2026-05-30] dates API: query start_time para filtrar fechas completamente reservadas — Reason: Bug original devolvía todas las fechas con availability_slots aunque todos estuvieran ya reservados. Ahora cruza con appointments.confirmed y solo devuelve fechas con al menos 1 slot libre.

[2026-05-30] TimeSlotPicker refreshKey prop — Reason: Cuando SLOT_TAKEN, el slot tomado seguía visible. Parent incrementa refreshKey → TimeSlotPicker re-fetch → lista actualizada.

[2026-05-30] BookingCalendar maxMonth = today + 3 meses — Reason: Sin límite, usuario podía navegar al infinito. 3 meses es suficiente horizonte de planificación para una barbería.

[2026-05-30] notes column reusada para servicio seleccionado — Reason: 3 servicios fijos no justifican columna nueva. notes es string libre, el valor del select cabe perfectamente. Sin schema change ni migración.

[2026-05-30] appointments.user_id nullable para walk-ins — Reason: Admin necesita crear citas sin que el cliente tenga cuenta Google. user_id NULL = walk-in identificado por nombre+teléfono solamente.

[2026-05-30] Partial unique index WHERE status='confirmed' reemplaza unique constraint — Reason: Constraint original bloqueaba re-reservar slots con citas canceladas. Partial index solo enforce unicidad en confirmed, slots cancelados quedan libres para nueva reserva.

[2026-05-30] Discriminated union AgendaModalMode — Reason: 7 acciones distintas (crear/editar/cancelar cita, bloquear/desbloquear slot, editar horas, bulk-creator) en un único modal con estado explícito. Evita 7 componentes Dialog separados o boolean flags complejos.

[2026-05-30] /api/admin/agenda GET con join en memoria — Reason: Supabase no tiene JOIN cómodo entre slots y appointments con prioridad confirmed>cancelled. Join en memoria tras 2 queries paralelas es más legible y suficientemente performante para rangos de ≤14 días.

[2026-05-30] startOfWeek weekStartsOn:1 (date-fns) para anclar semana al lunes — Reason: Semana laboral en España empieza lunes. Sin weekStartsOn:1 date-fns usa domingo (ISO americano).

[2026-05-31] RLS UPDATE requiere WITH CHECK explícito separado del USING — Reason: Sin WITH CHECK, PostgreSQL hereda USING como post-update check. status='cancelled_by_client' fallaba la condición status='confirmed' del USING → UPDATE bloqueado silenciosamente.

[2026-05-31] Cron usa supabaseAdmin (service_role) para todos los DB ops — Reason: Request de cron de Vercel no tiene cookies de sesión de usuario → auth.uid()=null → is_admin()=false → RLS bloquea todos los SELECT/UPDATE de appointments silenciosamente.

[2026-05-31] /api/booking-settings expone subset seguro de booking_settings — Reason: UI cliente necesita cancel/reschedule hours configurados por admin. Endpoint público con solo las keys necesarias evita exponer settings sensibles o booleanos de estado de servicios.

[2026-05-31] font-size base HTML 17px → 19px + clamp() utilities (.text-display .text-section-title .text-subsection) — Reason: Texto se veía pequeño en desktop. clamp() fluid sin media queries, escala bien en 320px–2560px.

[2026-05-31] BookingCalendar fondo claro (#F8F5F0) sobre página oscura (#0E0B08) — Reason: Contraste premium light-on-dark. Patrón de luxury booking system. Mejora legibilidad.

[2026-05-31] Admin nav 7 ítems → 5 secciones limpias sin solapamiento — Reason: Citas+Agenda solapaban, Gallery+BA+Imágenes eran 3 items para 1 concepto. 5 secciones → cero solapamiento.

[2026-05-31] Mobile admin: bottom tab bar fijo (no hamburger) con iOS env(safe-area-inset-bottom) — Reason: Patrón nativo iOS, ahorra un tap vs hamburger. Safe-area crítica para no ocultar tabs bajo home indicator.

[2026-05-31] /admin absorbe agenda (redirect /admin/agenda → /admin) — agenda mensual reemplaza vista semanal — Reason: Dos vistas de agenda solapaban. Monthly grid en /admin es más útil como home que lista plana.

[2026-05-31] schedule_template en booking_settings como JSON key — Reason: No requiere migration nueva. Encaja en key-value store existente.

[2026-05-31] DAY_ORDER ScheduleManager Lun-Dom display, interno 0-6 Sun=0 — Reason: UX española (lunes primero), consistente con date-fns getDay().
