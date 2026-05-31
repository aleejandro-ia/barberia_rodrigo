# BG Barber — Agent Context
# Last updated: 2026-05-31 (POST-16 complete)
# READ THIS ENTIRE FILE before doing anything in this project.

## What is this project
BG Barber es un SaaS de reservas para peluquerías, con Rodrigo como instancia piloto. Clientes reservan via landing page con Google OAuth. Admin (Rodrigo) gestiona disponibilidad, citas, servicios y configuración desde /admin. Stack: Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase + Vercel.

## Current State
POST-16 completo (tsc 0 errores, commit pendiente). Sistema funcional en prod (cec29e4). POST-16 añade: tipografía fluid clamp(), calendario landing light-on-dark, admin nav 5 secciones + mobile bottom tab bar iOS, agenda mensual en /admin, backend de horarios con plantilla semanal + generador de slots.
Full detail: see .forge/PROGRESS.md

## EXACT NEXT STEP
POST-16 listo para deploy. Ejecutar git commit + push → verificar Vercel build → smoke test visual en prod.
Específico: `git add -A && git commit -m "POST-16: visual overhaul + admin reorganization + horarios backend" && git push origin main`
Smoke test: /admin (monthly grid), /admin/media (3 tabs), /admin/ajustes (settings), /admin/schedule (4 sections), mobile bottom bar, landing calendar (light background), landing headings bigger.

## Tech Stack
- Framework: Next.js 16 App Router (proxy.ts NO middleware.ts)
- Database: Supabase PostgreSQL — RLS en todas las tablas
- Auth: Supabase Auth Google OAuth only — isAdmin() en lib/auth.ts
- Styling: Tailwind v4 — paleta dark gold (#0E0B08, #C9A96E, #F2EDE7)
- Font: Plus Jakarta Sans (next/font/google) — base 19px
- Icons: @phosphor-icons/react
- Animation: motion/react
- Email: Resend SDK (graceful degradation)
- Deploy: Vercel auto-deploy on push to main

## Important Files
proxy.ts — middleware Next.js 16 (NO tocar — convención Next.js 16 usa proxy.ts no middleware.ts)
lib/auth.ts — isAdmin() → alejandronopez@gmail.com
lib/supabase/server.ts — createClient() anon key con cookies (sujeto a RLS)
lib/supabase/admin.ts — supabaseAdmin service_role (bypasa RLS) — usar para ops sin sesión
types/index.ts — todos los tipos: AppointmentStatus (7 valores), Appointment, BookingSettings, Service, AgendaDay, AgendaSlot
app/globals.css — Tailwind v4, font-size 19px, .text-display .text-section-title .text-subsection clamp()
components/admin/AdminNav.tsx — 5-item nav, desktop top + mobile bottom tab bar con iOS safe-area
app/admin/layout.tsx — pb-20 md:pb-10 en main para bottom tab bar
app/admin/page.tsx — monthly calendar grid, AgendaDayPanel lateral, AgendaModal
app/admin/media/page.tsx — NUEVA: Galería + Antes/Después + Imágenes del sitio (3 tabs)
app/admin/ajustes/page.tsx — NUEVA: Estado sistema + Reglas reservas + Recordatorios
app/admin/schedule/page.tsx — wraps ScheduleManager (4 secciones)
components/admin/ScheduleManager.tsx — 4 secciones: franjas/día + plantilla semanal + generador + manual
components/admin/agenda/MonthlyCalendarGrid.tsx — NUEVA: 7-col monthly grid, weekStartsOn:1
components/admin/agenda/MonthCalNav.tsx — NUEVA: prev/next/hoy navigation
actions/scheduleTemplate.ts — NUEVO: getScheduleTemplate, saveScheduleTemplate, generateSlotsFromTemplate
app/api/admin/schedule-template/route.ts — NUEVO: GET admin-only
app/api/admin/agenda/route.ts — GET agenda admin, límite 31 días
components/landing/BookingCalendar.tsx — redesigned: #F8F5F0 bg, gold accents
actions/appointments.ts — cancelAppointment + rescheduleAppointment con .select('id')
actions/agenda.ts — adminCreate/Edit/ToggleBlock/EditSlotTimes/Reschedule/NoShow/Completed/CopyWeek
actions/bookingSettings.ts — getBookingSettings(), updateBookingSetting()
vercel.json — cron schedule 0 8 * * *
supabase/migrations/004_fix_rls_update.sql — última migration aplicada en prod (NO crear más sin confirmar)

## API Contracts
See .forge/CONTRACTS.md — do not deviate from these contracts

## Critical Patterns
- Cron / ops sin sesión: usar supabaseAdmin (service_role), NUNCA createClient()
- RLS UPDATE: SIEMPRE WITH CHECK explícito separado del USING
- Email: lazy init Resend dentro de función, nunca top-level de módulo
- Server actions → createClient() (anon, cookies). API routes sin auth → supabaseAdmin
- booking_settings: key-value store. schedule_template guardado como JSON string bajo key 'schedule_template'
- Admin nav: 5 secciones fijas (Agenda/Servicios/Media/Horarios/Ajustes) — NO añadir más sin redesign
- Bottom tab bar: env(safe-area-inset-bottom) en style (no Tailwind pb-safe)

## Do NOT touch
- proxy.ts — Next.js 16 middleware convention
- supabase/migrations/ — no modificar migrations ya aplicadas
- lib/auth.ts isAdmin() — hardcoded email
- components/admin/agenda/AgendaDayPanel.tsx — no modificar (reutilizado por monthly grid)
- components/admin/agenda/AgendaModal.tsx — no modificar (reutilizado, 11 modos)

## DB Migration Status
- 001_initial_schema.sql ✅ aplicada
- 002_agenda_phase1.sql ✅ aplicada
- 003_client_premium.sql ✅ aplicada
- 004_fix_rls_update.sql ✅ aplicada (Supabase project: tfnihyxspgtlnlykkxdn)
- No migration necesaria para POST-16 (schedule_template usa booking_settings existente)

## Env Vars requeridas
NEXT_PUBLIC_SUPABASE_URL — ya configurada
NEXT_PUBLIC_SUPABASE_ANON_KEY — ya configurada
ADMIN_EMAIL — ya configurada
RESEND_API_KEY — opcional (email degrada sin ella)
RESEND_FROM_EMAIL — opcional
SUPABASE_SERVICE_ROLE_KEY — necesaria para cron reminders
CRON_SECRET — necesaria para proteger /api/cron/reminders

## FORGE Documents
- .forge/PROJECT_BRIEF.md — requisitos y decisiones técnicas
- .forge/PLAN.md — plan de fases
- .forge/CONTRACTS.md — contratos API
- .forge/DATA_MODEL.md — schema de base de datos
- .forge/SKILL_SELECTION.md — skills asignadas por fase
- .forge/DECISIONS.md — registro de decisiones
- .forge/PROGRESS.md — estado live del proyecto (más importante)
