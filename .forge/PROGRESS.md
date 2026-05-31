# Project Progress
# Last updated: 2026-05-30 18:00
# Session: Admin Agenda Premium Phase 1 + build fixes + service dropdown

## Executive Summary
Barbería BG Barber — app de reservas premium para Rodrigo Bargueño. Todas las fases originales completas. Admin Agenda Premium Phase 1 completa: vista semanal, panel de día, gestión de slots y citas manuales (walk-in), WhatsApp directo. Pendiente: hydration bug en AboutSection TICKS array (no rompe funcionalidad).

## Phase Status

✅ PHASE 0 — Setup & base [completed 2026-05-29]
✅ PHASE 1 — Database & schema [completed 2026-05-29]
✅ PHASE 2 — Authentication [completed 2026-05-29]
✅ PHASE 3 — API layer [completed 2026-05-29]
✅ PHASE 4 — Public landing UI [completed 2026-05-29]
✅ PHASE 5 — Admin panel UI [completed 2026-05-29]
✅ PHASE 6 — Deploy & final config [completed 2026-05-29]

✅ POST-1 — Rediseño landing completo [completed 2026-05-30]
✅ POST-2 — Rediseño admin panel premium [completed 2026-05-30]
✅ POST-3 — Backend connections completas [completed 2026-05-30]

✅ POST-4 — Tipografía: Plus Jakarta Sans + tamaños bumpeados [completed 2026-05-30]
   Fuente: Outfit → Plus Jakarta Sans (peso 300 eliminado, pixelaba en dark bg)
   Base HTML font-size: 16px → 17px (globals.css)
   Cambios en: HeroSection, AboutSection, ServicesSection, GallerySection,
               BeforeAfterSection, BookingSection, BookingCalendar, TimeSlotPicker, NavBar

✅ POST-5 — Copy real de Instagram @bg.barberstyle [completed 2026-05-30]

✅ POST-6 — GalleryCarousel: infinite marquee belt [completed 2026-05-30]
   Implementación final:
     - RAF loop: posRef -= AUTO_SPEED (0.45px/frame, ~27px/seg)
     - Triple array ([...slots, ...slots, ...slots]) para contenido continuo
     - Seamless reset: if posRef <= -totalW → posRef += totalW
     - Drag + inercia: pointer events, FRICTION 0.92
     - Edge fades: gradiente bg izq/der (#161310)

✅ POST-7 — Booking system redesign completo [completed 2026-05-30]
   Step machine: 'date' | 'slot' | 'form' | 'confirmed' | 'blocked'
   OAuth recovery: sessionStorage 'bgbarber_pending_booking'
   SLOT_TAKEN → setSlotRefreshKey(k+1) → TimeSlotPicker refetch

✅ POST-8 — Build fix: AboutSection portrait prop TypeScript error [completed 2026-05-30]
   Error: Type 'string | null | undefined' not assignable to 'string | null'
   Fix: <PortraitContent url={portrait ?? null} /> (línea 99)
   Commit: eacc85a

✅ POST-9 — Admin cambios: back button + service dropdown [completed 2026-05-30]
   AdminNav.tsx: añadido "← Volver al sitio" link a /
   AdminNav.tsx: añadido link Agenda (CalendarDots) en navLinks
   BookingSection.tsx: textarea notas → <select> servicio obligatorio
     SERVICES: [Corte Clásico 7€, Corte 9€, Corte con Barba 10€]
     Sin cambio de schema — valor guardado en columna notes existente
   Commit: incluido en push multi-commit

✅ POST-10 — Admin Agenda Premium Phase 1 [completed 2026-05-30]
   Commit: 95386da — subido a main → Vercel auto-deploy activo

   DB MIGRATION (aplicada en Supabase tfnihyxspgtlnlykkxdn):
     supabase/migrations/002_agenda_phase1.sql
     - availability_slots: +blocked_reason text, +updated_at timestamptz (trigger auto)
     - appointments.user_id: nullable (walk-ins sin cuenta cliente)
     - DROP unique constraint → partial unique index WHERE status='confirmed'
     - Nueva RLS policy: appointments_insert_admin (WITH CHECK is_admin())
     - UPDATE appointments_select_own_or_admin para user_id IS NULL

   NUEVOS ARCHIVOS (9):
     types/index.ts — extendido: AgendaSlot, AgendaDay, AvailabilitySlot+, Appointment user_id?
     lib/validations.ts — +adminCreateAppointmentSchema, +adminEditAppointmentSchema
     actions/agenda.ts — adminCreateAppointment, adminEditAppointment, adminToggleSlotBlock, adminEditSlotTimes
     app/api/admin/agenda/route.ts — GET ?from&to: slots+citas join → AgendaDay[]
     components/admin/agenda/AgendaWeekNav.tsx — prev/next/today
     components/admin/agenda/DayCard.tsx — día + dots colores
     components/admin/agenda/AgendaWeekGrid.tsx — grid 7 cols
     components/admin/agenda/AgendaSlotRow.tsx — fila slot: libre/confirmado/bloqueado/cancelado + walk-in badge
     components/admin/agenda/AgendaDayPanel.tsx — panel día con lista slots
     components/admin/agenda/AgendaModal.tsx — modal discriminated union: 7 modos
     app/admin/agenda/page.tsx — página principal, estado semanal, layout grid lg:[1fr_380px]

   FEATURES:
     - Walk-in badge: pill dorado si appointment.user_id === null
     - WhatsApp link: https://wa.me/34{phone}?text=Hola {name}...
     - Diagonal CSS stripes para slots bloqueados
     - Botones hover-reveal por estado del slot
     - Sticky day panel en desktop
     - Bulk creator modal reutiliza SlotBulkCreator existente

✅ POST-11 — Hydration error en AboutSection TICKS [completed]
   Fix: .toFixed(4) + parseFloat() en x1/y1/x2/y2 — ya aplicado en líneas 17-20

## Technical Decisions Log
[2026-05-29] Next.js 16.2.6, proxy.ts en vez de middleware.ts
[2026-05-29] Tailwind v4, shadcn/ui base-nova, date-fns es locale, sonner
[2026-05-30] Warm dark palette (#0E0B08, #161310, #C9A96E, #F2EDE7)
[2026-05-30] Plus Jakarta Sans reemplaza Outfit — mejor rendering dark bg
[2026-05-30] font-size base 17px — más presencia visual sin romper layouts
[2026-05-30] Google OAuth ONLY (phone OTP eliminado)
[2026-05-30] GitHub auto-deploy vía Vercel Git Integration
[2026-05-30] 3D carousel → infinite marquee belt (más limpio, sin CSS 3D issues)
[2026-05-30] sessionStorage para pendingSlot OAuth — React state no sobrevive redirects
[2026-05-30] BookingSection step machine — flujo lineal sin renderizado condicional complejo
[2026-05-30] dates API fix: query start_time para poder filtrar fechas completamente reservadas
[2026-05-30] notes column reusada para servicio seleccionado — sin cambio schema
[2026-05-30] appointments.user_id nullable — admin walk-ins sin cuenta cliente
[2026-05-30] partial unique index WHERE status='confirmed' — permite re-reservar slots cancelados
[2026-05-30] discriminated union para AgendaModal — 1 modal, 7 modos, sin duplicar componentes
[2026-05-30] /api/admin/agenda route — GET rango fechas, join en memoria, devuelve AgendaDay[]
[2026-05-30] startOfWeek weekStartsOn:1 — semana empieza lunes (date-fns)

## Key Files
app/page.tsx — composición landing
app/layout.tsx — Plus Jakarta Sans + Dancing Script, metadata BG Barber
app/globals.css — Tailwind v4, font-size 17px
app/auth/callback/route.ts — OAuth callback
app/api/availability/dates/route.ts — fechas disponibles (filtra llenas)
app/api/availability/slots/route.ts — slots disponibles para una fecha
app/api/admin/agenda/route.ts — GET semana de datos: slots + citas → AgendaDay[]
app/admin/agenda/page.tsx — Admin Agenda: semana grid + sticky day panel
components/landing/GalleryCarousel.tsx — infinite marquee belt
components/landing/BookingSection.tsx — step machine + OAuth recovery + service select
components/landing/BookingCalendar.tsx — calendario, maxMonth 3 meses
components/landing/TimeSlotPicker.tsx — slots con refreshKey + duración
components/landing/AboutSection.tsx — ⚠️ hydration bug TICKS (pendiente)
components/admin/AdminNav.tsx — nav admin: Citas/Agenda/Galería + Volver al sitio
components/admin/agenda/AgendaSlotRow.tsx — workhorse: estados visual + acciones hover
components/admin/agenda/AgendaModal.tsx — modal multi-modo discriminated union
actions/agenda.ts — adminCreate/Edit/ToggleBlock/EditSlotTimes server actions
actions/appointments.ts — bookAppointment, adminCancelAppointment
proxy.ts — middleware Next.js 16 (NO tocar)
lib/auth.ts — isAdmin() → alejandronopez@gmail.com
supabase/migrations/002_agenda_phase1.sql — schema agenda phase 1

⏳ POST-12 — Cliente Premium + Mejoras Sistema Reservas [PENDIENTE EJECUCIÓN]
   Spec completo en: .forge/NEXT_PHASE_SPEC.md
   Incluye:
     - DB migration 003 (nuevos estados, booking_settings, quitar límite 1 cita)
     - "Mis citas" page cliente (/mis-citas)
     - Cancelación con reglas configurables (booking_settings.cancel_hours_before)
     - Reprogramación por cliente (UPDATE in-place, con ventana temporal)
     - Calendar export (.ics + Google Calendar URL)
     - WhatsApp helper centralizado (lib/whatsapp.ts)
     - Estados: cancelled_by_client, cancelled_by_admin, no_show
     - Múltiples citas por usuario (warning UI, no bloqueado en servidor)
     - Admin puede reprogramar cita desde agenda
     - 11 archivos nuevos, 10 archivos modificados

## EXACT NEXT STEP
Ejecutar POST-12. Leer .forge/NEXT_PHASE_SPEC.md completo antes de tocar código.
Empezar por: SQL migration 003 en Supabase SQL Editor (proyecto tfnihyxspgtlnlykkxdn).
Luego seguir orden de ejecución documentado en el spec.
