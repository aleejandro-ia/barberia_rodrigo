# Project Brief
Generated: 2026-05-31
Mode: CONTINUATION — Fase 2 (Cliente Premium + Admin Profesional)

## What the user wants
BG Barber es un producto SaaS replicable para peluquerías. Rodrigo lo usa como instancia piloto.
Objetivo de esta fase: convertir el sistema en una experiencia premium completa — área "Mis citas" para el cliente, cancelación y reprogramación con reglas configurables, catálogo de servicios administrable, email transaccional con Resend, recordatorios automáticos por Vercel Cron, métricas operativas en admin, historial de cliente, y todas las acciones admin completadas (reprogramar, no-show, completada). Toda la lógica del agendador debe ser robusta frente a todos los escenarios posibles.

## Problem & users
When [a client wants to manage their appointment], [barbershop customers] want [to cancel/reschedule without calling the barber] so they can [self-serve their own bookings like a premium service].
When [the barber wants to run his business], [Rodrigo as admin] wants [to manage clients, mark attendance, see metrics, and control the catalog] so he can [operate professionally and sell the product to other barbershops].
Specific users: (1) Clients — Google OAuth, multi-appointment, self-service cancellation/rescheduling, calendar export, email reminders; (2) Admin (Rodrigo) — full agenda control, service catalog, metrics, copy-week, client history.
Why now: product pivot from hobby project to SaaS — needs professional-grade features before replicating.

## Appetite
Team: solo developer (Alejandro)
Time investment: 1-2 sessions of focused development
Hard constraints: no breaking changes to existing flows, backwards compatible DB, email optional (degrades gracefully if RESEND_API_KEY missing)

## Solution — Phase 2 scope
Type: continuation of existing Next.js App Router web app
Core features:
1. Client self-service area (/mis-citas): view, cancel, reschedule, add to calendar
2. Admin professional tools: reschedule/complete/no-show from agenda, service catalog, metrics, copy week
3. Email transactional (Resend) + Vercel Cron reminders (graceful degradation if not configured)
Explicit no-gos: no payments, no multi-barber, no real-time websockets, no mobile app, no SMS

## Technical decisions
Stack: Next.js 16 App Router + TypeScript + Tailwind v4 (unchanged)
Database: Supabase PostgreSQL — migration 003 adds services, booking_settings, new appointment fields
Auth: Supabase Auth Google OAuth (unchanged)
Email: Resend SDK — server-side only, degrades gracefully without API key
Cron: Vercel Cron (vercel.json) hitting /api/cron/reminders, secured with CRON_SECRET
Deploy: Vercel auto-deploy on push to main (unchanged)
External integrations: Resend (email), WhatsApp via wa.me (unchanged), Google Calendar URL, .ics standard

## Business model
SaaS pilot — free for Rodrigo, intended to be replicated and sold to other barbershops.
booking_settings tabla enables per-business configuration (foundation for multi-tenant).

## Technical recommendations
- Rescheduling via UPDATE in-place (not create+cancel): avoids RLS INSERT conflict and "don't release old slot" complexity
- Service catalog stores name in appointments.notes (no FK): backwards compatible, walk-ins can use free text
- Email is optional/graceful: all email calls check RESEND_API_KEY first — booking never fails because email fails
- min_hours_advance + bookings_enabled in booking_settings: filtering in action + in TimeSlotPicker UI
- Client history via phone grouping in appointments table (no separate clients table needed at this scale)

## Flags & warnings
- RESEND_API_KEY needed before emails work (resend.com free tier: 3k emails/month)
- SUPABASE_SERVICE_ROLE_KEY needed for cron to fetch user emails (auth.users table)
- CRON_SECRET needed to protect /api/cron/reminders endpoint
- Vercel free plan: 2 cron executions/day max — sufficient for daily reminder batch
- Walk-in appointments (user_id null) never get email reminders — expected behavior

## Complexity estimate
Size: Medium
Estimated time range: 1-2 focused sessions
Main complexity drivers: cron + email integration (infrastructure), admin modal expansion (many new modes), BookingSection refactor (remove blocked state, add warning dialog)

---

## Current state audit
Stack in use: Next.js 16 + Supabase + Tailwind v4 + Vercel + @phosphor-icons/react + motion/react + date-fns
What works:
- Full booking flow: date → slot → form → confirmed + OAuth recovery via sessionStorage
- Admin panel: citas list, gallery, schedule, before-after, settings, agenda semanal
- Agenda: create/edit/cancel/block slots + walk-in manual booking + WhatsApp links
- Auth: Google OAuth only, RLS on all tables
- DB: migrations 001 + 002 applied

What is incomplete:
- No /mis-citas page (API exists but no UI)
- No service catalog (hardcoded en BookingSection)
- No email (no Resend integration)
- No cron reminders
- No metrics dashboard
- Admin: no reschedule/complete/no-show from agenda
- No booking_settings table (cancellation rules hardcoded nowhere)
- No copy-week feature

What is broken or missing:
- Status enum only has confirmed/cancelled (blocks new states)
- RLS insert policy blocks multiple bookings per user (intentional but changing this phase)
- WhatsApp helper duplicated inline (AgendaSlotRow)

## Technical debt detected
- appointments CHECK constraint must be expanded before deploying new status values
- appointments_insert_authenticated_one_active RLS policy must be dropped before multiple bookings work
- Both are in migration 003 — must run before any code deploy
