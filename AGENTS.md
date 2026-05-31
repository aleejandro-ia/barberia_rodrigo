# Barbería BG Barber — Agent Context
# Last updated: 2026-05-30 18:00
# READ THIS ENTIRE FILE before doing anything in this project.

## What is this project
App de reservas premium para la barbería BG Barber de Rodrigo Bargueño. Landing page dark/gold con hero, about, servicios, galería infinita (marquee), antes/después y reserva online con step machine y service select. Admin panel premium: citas, galería, horarios, antes/después, imágenes + agenda semanal con gestión de slots y citas manuales (walk-in). Stack: Next.js 16 + Supabase + Tailwind v4 + Vercel. GitHub auto-deploy: push a main → https://barberia-rodrigo.vercel.app

## Current State
Todas las fases completas + Admin Agenda Phase 1 completa (commit 95386da). Sin bugs.
POST-12 (Cliente Premium) especificado y pendiente de ejecución.

## EXACT NEXT STEP
Ejecutar POST-12 — spec completo en `.forge/NEXT_PHASE_SPEC.md`.
Orden: (1) SQL migration 003 en Supabase (proyecto tfnihyxspgtlnlykkxdn) → (2) types/index.ts → (3) lib helpers → (4) actions → (5) componentes cliente → (6) admin agenda updates → (7) tsc --noEmit → (8) push.

## Tech Stack
- Framework: Next.js 16 App Router (TypeScript)
- Database: Supabase PostgreSQL (ID: tfnihyxspgtlnlykkxdn, eu-west-1)
- Auth: Supabase Auth — Google OAuth ONLY
- Storage: Supabase Storage — gallery, before-after, site-images (todos públicos)
- Styling: Tailwind v4. Paleta: #0E0B08 bg, #161310 cards, #C9A96E gold, #F2EDE7 warm white
- Fonts: Plus Jakarta Sans (UI, var --font-outfit, base 17px), Dancing Script (firma)
- Animation: Motion (motion/react)
- Icons: @phosphor-icons/react
- Deploy: Vercel, proyecto barberia-rodrigo — GitHub aleejandro-ia/barberia_rodrigo → auto-deploy main

## Important Files
proxy.ts — middleware Next.js 16 (NO crear middleware.ts — rompe routing)
lib/auth.ts — isAdmin() → hardcoded a alejandronopez@gmail.com
app/layout.tsx — Plus Jakarta Sans + Dancing Script, bg #0E0B08
app/globals.css — Tailwind v4, font-size: 17px en html
app/auth/callback/route.ts — OAuth callback: exchangeCodeForSession, redirect a next param
app/api/availability/dates/route.ts — fechas disponibles (filtra fechas completamente llenas)
app/api/availability/slots/route.ts — slots disponibles para una fecha
app/api/admin/agenda/route.ts — GET ?from&to → AgendaDay[] (slots + citas join en memoria)
app/admin/agenda/page.tsx — Admin Agenda: weekStart state, fetchWeek, grid lg:[1fr_380px]
components/landing/GalleryCarousel.tsx — infinite marquee belt (RAF, triple array, drag+inercia)
components/landing/BookingSection.tsx — step machine + OAuth sessionStorage recovery + service <select>
components/landing/BookingCalendar.tsx — calendario, maxMonth 3 meses adelante
components/landing/TimeSlotPicker.tsx — slots con refreshKey prop + duración
components/landing/AboutSection.tsx — ⚠️ HYDRATION BUG en TICKS array (Math.cos/sin floats)
components/admin/AdminNav.tsx — nav: Citas/Agenda/Galería/etc + "← Volver al sitio"
components/admin/agenda/AgendaSlotRow.tsx — workhorse fila slot: estados visual + hover actions + walk-in badge
components/admin/agenda/AgendaModal.tsx — modal discriminated union: 7 modos (closed/create-appt/edit-appt/cancel-appt/block-slot/edit-slot-times/bulk-creator)
actions/agenda.ts — adminCreateAppointment, adminEditAppointment, adminToggleSlotBlock, adminEditSlotTimes
actions/appointments.ts — bookAppointment, adminCancelAppointment (reutilizado desde AgendaModal)
supabase/migrations/002_agenda_phase1.sql — nullable user_id, partial unique index, blocked_reason, RLS admin insert

## API Contracts
See .forge/CONTRACTS.md

## Do NOT touch
proxy.ts — Next.js 16 usa proxy.ts, NO middleware.ts
supabase/migrations/ — solo via SQL editor de Supabase MCP
.env.local — credenciales reales, no commitear

## Booking System Logic
Step machine: 'date' → 'slot' → 'form' → 'confirmed' | 'blocked'
OAuth recovery: sessionStorage key 'bgbarber_pending_booking' = {date, slot}
  Guardado en handleSelectSlot si !user → restaurado en onAuthStateChange SIGNED_IN event
Active booking check: query Supabase en onAuthStateChange → step 'blocked' si hay cita futura
SLOT_TAKEN error → setSlotRefreshKey(k+1) → TimeSlotPicker re-fetch → slot desaparece
Service select: SERVICES array = [Corte Clásico 7€, Corte 9€, Corte con Barba 10€] — guardado en columna notes

## Admin Agenda Logic
Week view: startOfWeek(date, {weekStartsOn: 1}) — lunes. Fetch via /api/admin/agenda?from&to.
AgendaDay counts: confirmedCount, blockedCount, freeCount, totalSlots.
AgendaSlotRow estados: libre (gold) / confirmado (green) / bloqueado (diagonal stripes) / cancelado (red-dim).
Walk-in badge: pill dorado si appt.user_id === null.
WhatsApp: https://wa.me/34{phone}?text=Hola {name}...
AgendaModal discriminated union — modo 'bulk-creator' reutiliza SlotBulkCreator existente.
adminCancelAppointment importado de actions/appointments.ts (no duplicar en actions/agenda.ts).

## FORGE Documents
- .forge/PROGRESS.md — estado vivo (más importante)
- .forge/PROJECT_BRIEF.md, PLAN.md, CONTRACTS.md, DATA_MODEL.md
- .forge/DECISIONS.md — registro de decisiones
- .claude/napkin.md — errores y patrones aprendidos
