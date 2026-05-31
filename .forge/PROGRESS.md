# Project Progress
# Last updated: 2026-05-31 (POST-16 complete)
# Session: POST-16 visual overhaul + admin reorganización + horarios backend

## Executive Summary
BG Barber SaaS de reservas para peluquerías. Sistema completamente funcional en prod (commit cec29e4). POST-16 acaba de completarse: tipografía fluid con clamp(), calendario landing rediseñado a light-on-dark, admin panel reorganizado con nav de 5 secciones + bottom tab bar iOS, agenda mensual, y backend de horarios con plantilla semanal. Pendiente: commit + push → Vercel deploy → smoke test visual.

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
✅ POST-5 — Copy real de Instagram @bg.barberstyle [completed 2026-05-30]
✅ POST-6 — GalleryCarousel: infinite marquee belt [completed 2026-05-30]
✅ POST-7 — Booking system redesign completo [completed 2026-05-30]
✅ POST-8 — Build fix: AboutSection portrait prop TypeScript error [completed 2026-05-30]
✅ POST-9 — Admin cambios: back button + service dropdown [completed 2026-05-30]
✅ POST-10 — Admin Agenda Premium Phase 1 [completed 2026-05-30]
✅ POST-11 — Hydration error en AboutSection TICKS [completed 2026-05-30]

✅ POST-12 — Fase 2: Cliente Premium + Admin Profesional [completed 2026-05-31]
   Commit: a5330fe — 47 files changed, 5745 insertions, 797 deletions

✅ POST-13 — Build fix: Resend lazy init [completed 2026-05-31]
   Commit: 8063276

✅ POST-14 — Bugfix sprint: 4 bugs críticos [completed 2026-05-31]
   Commit: 8c8a04b

✅ POST-15 — UX: badge "Pasada" para citas confirmadas pasadas [completed 2026-05-31]
   Commit: cec29e4

✅ POST-16 — Visual Overhaul + Admin Reorganización + Horarios Backend [completed 2026-05-31]
   TSC: 0 errores. Commit pendiente.

   P16-A — Tipografía: ✅
     app/globals.css — html font-size 17→19px, .text-display clamp(2.2rem,5vw+0.5rem,4.5rem), .text-section-title clamp(1.6rem,3vw+0.3rem,2.8rem), .text-subsection clamp(1.1rem,2vw+0.2rem,1.6rem)
     components/landing/HeroSection.tsx — usa .text-display
     components/landing/ServicesSection.tsx — usa .text-section-title
     components/landing/AboutSection.tsx — usa .text-section-title
     components/landing/BeforeAfterSection.tsx — usa .text-section-title
     components/landing/GallerySection.tsx — usa .text-section-title
     Dancing Script decorativos: NO tocados

   P16-B — Calendario Landing: ✅
     components/landing/BookingCalendar.tsx — fondo #F8F5F0, texto oscuro, gold para disponibles/seleccionado, border-radius 20px, shadow
     components/landing/BookingSection.tsx — contenedor ajustado, step machine NO tocado

   P16-C — Admin Nav + Rutas: ✅
     components/admin/AdminNav.tsx — 7→5 items, desktop top nav, mobile bottom tab bar fixed + iOS safe-area
     app/admin/layout.tsx — pb-20 md:pb-10 en main
     app/admin/media/page.tsx — NUEVA: 3 tabs (Galería/Antes-Después/Imágenes del sitio)
     app/admin/ajustes/page.tsx — NUEVA: Estado+Reglas+Recordatorios (sin SettingsManager)
     app/admin/settings/page.tsx — redirect 308 → /admin/ajustes
     app/admin/gallery/page.tsx — redirect → /admin/media
     app/admin/before-after/page.tsx — redirect → /admin/media

   P16-D — Admin Agenda Mensual: ✅
     app/admin/page.tsx — reescrito: monthly calendar grid + AgendaDayPanel lateral
     components/admin/agenda/MonthlyCalendarGrid.tsx — NUEVA: 7-col grid, weekStartsOn:1, min-h 44px cells
     components/admin/agenda/MonthCalNav.tsx — NUEVA: prev/next/hoy nav para mes
     app/api/admin/agenda/route.ts — límite 14→31 días
     app/admin/agenda/page.tsx — redirect → /admin

   P16-G — Admin Horarios Backend + Redesign: ✅
     actions/scheduleTemplate.ts — NUEVO: getScheduleTemplate, saveScheduleTemplate, generateSlotsFromTemplate
     app/api/admin/schedule-template/route.ts — NUEVO: GET admin-only
     components/admin/ScheduleManager.tsx — 4 secciones: franjas/día + plantilla semanal + generador + creación manual
     app/admin/schedule/page.tsx — sin cambios (ya wrapeaba ScheduleManager)

## Technical Decisions Log
[2026-05-29] Next.js 15 App Router + Supabase chosen as stack
[2026-05-29] Admin identified by ADMIN_EMAIL env var + RLS helper function
[2026-05-29] Per-date availability slots (not recurring weekly schedule)
[2026-05-29] Bulk slot generator in admin
[2026-05-29] Supabase Storage for gallery images
[2026-05-29] design-taste-frontend + high-end-visual-design skills for public landing
[2026-05-30] Warm dark palette para admin también
[2026-05-30] Plus Jakarta Sans reemplaza Outfit
[2026-05-30] font-size base HTML = 17px (→ 19px en POST-16)
[2026-05-30] Google OAuth ONLY
[2026-05-31] booking_settings como key-value store — schedule_template JSON key añadido en POST-16
[2026-05-31] Admin nav: 7 ítems → 5 secciones (Agenda/Servicios/Media/Horarios/Ajustes) — POST-16
[2026-05-31] Bottom tab bar en mobile con iOS env(safe-area-inset-bottom) — no hamburger — POST-16
[2026-05-31] /admin absorbe /admin/agenda (redirect) — agenda mensual reemplaza vista semanal — POST-16
[2026-05-31] /admin/media nuevo — unifica Gallery+BeforeAfter+Imágenes en tabs — POST-16
[2026-05-31] /admin/ajustes nuevo — separa settings config de settings imágenes — POST-16
[2026-05-31] DAY_ORDER en ScheduleManager: display Lun–Dom (1-6,0), interno 0-6 Sun=0 — consistente con date-fns getDay()
[2026-05-31] BookingCalendar: fondo claro (#F8F5F0) sobre página oscura (#0E0B08) — contraste premium light-on-dark

## Key Files
app/globals.css — Tailwind v4, font-size 19px, clamp() utilities .text-display .text-section-title .text-subsection
app/admin/layout.tsx — layout admin con pb-20 md:pb-10 para bottom tab bar
components/admin/AdminNav.tsx — nav 5 secciones, bottom tab bar mobile con iOS safe-area
app/admin/media/page.tsx — unified media page: Galería + Antes/Después + Imágenes del sitio
app/admin/ajustes/page.tsx — settings: Estado sistema + Reglas reservas + Recordatorios
app/admin/page.tsx — monthly calendar grid, reuses AgendaDayPanel + AgendaModal
components/admin/agenda/MonthlyCalendarGrid.tsx — 7-col monthly grid, weekStartsOn:1
components/admin/agenda/MonthCalNav.tsx — month navigation prev/next/hoy
app/api/admin/agenda/route.ts — GET agenda, límite 31 días
actions/scheduleTemplate.ts — getScheduleTemplate, saveScheduleTemplate, generateSlotsFromTemplate
app/api/admin/schedule-template/route.ts — GET admin-only para schedule template
components/admin/ScheduleManager.tsx — 4 secciones con plantilla semanal + generador
components/landing/BookingCalendar.tsx — redesigned: light #F8F5F0 background, gold accents
proxy.ts — middleware Next.js 16 (NO tocar)
lib/auth.ts — isAdmin() → alejandronopez@gmail.com
supabase/migrations/004_fix_rls_update.sql — última migration aplicada en prod

## EXACT NEXT STEP
POST-16 completo (tsc 0 errores). Ejecutar:
1. `git add -A` + `git commit -m "POST-16: visual overhaul + admin reorganization + horarios backend"` + `git push origin main`
2. Verificar Vercel deploy en dashboard
3. Smoke test visual en prod:
   - /admin → monthly calendar grid visible
   - /admin/media → 3 tabs Galería/Antes-Después/Imágenes
   - /admin/ajustes → Estado+Reglas+Recordatorios (sin imágenes)
   - /admin/schedule → 4-section ScheduleManager
   - Mobile /admin: bottom tab bar visible, no ocluye contenido
   - Landing: calendario de reservas con fondo claro sobre página oscura
   - Landing: headings más grandes en desktop
