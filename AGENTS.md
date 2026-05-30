# Barbería BG Barber — Agent Context
# Last updated: 2026-05-30 (Carousel belt + Booking redesign)
# READ THIS ENTIRE FILE before doing anything in this project.

## What is this project
App de reservas premium para la barbería BG Barber de Rodrigo Bargueño. Landing page dark/gold con hero, about, servicios, galería infinita (marquee), antes/después y reserva online con step machine. Admin panel para gestionar citas, galería, horarios, antes/después e imágenes. Stack: Next.js 16 + Supabase + Tailwind v4 + Vercel. GitHub auto-deploy: push a main → https://barberia-rodrigo.vercel.app

## Current State
Todas las fases completas + post-launch mejoras completas excepto:
1. ⚠️ Hydration error en AboutSection.tsx (TICKS floating point — único bug pendiente)

## EXACT NEXT STEP
Arreglar hydration error en `components/landing/AboutSection.tsx`.
Buscar array TICKS (~línea 30), en el return del Array.from aplicar .toFixed(4) + parseFloat():
```
x1: parseFloat((cx + rOuter * Math.cos(angleRad)).toFixed(4)),
y1: parseFloat((cy + rOuter * Math.sin(angleRad)).toFixed(4)),
x2: parseFloat((cx + rInner * Math.cos(angleRad)).toFixed(4)),
y2: parseFloat((cy + rInner * Math.sin(angleRad)).toFixed(4)),
```

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
components/landing/GalleryCarousel.tsx — infinite marquee belt (RAF, triple array, drag+inercia)
components/landing/BookingSection.tsx — step machine completo + OAuth sessionStorage recovery
components/landing/BookingCalendar.tsx — calendario, maxMonth 3 meses adelante
components/landing/TimeSlotPicker.tsx — slots con refreshKey prop + duración
components/landing/AboutSection.tsx — ⚠️ HYDRATION BUG en TICKS array (Math.cos/sin floats)
actions/appointments.ts — bookAppointment: valida, comprueba slot, crea appointment
app/api/auth/is-admin/route.ts — check admin para NavBar

## API Contracts
See .forge/CONTRACTS.md

## Do NOT touch
proxy.ts — Next.js 16 usa proxy.ts, NO middleware.ts
supabase/migrations/ — solo via SQL editor de Supabase
.env.local — credenciales reales, no commitear

## Known Bugs
AboutSection.tsx TICKS array: x1/y1/x2/y2 floats divergen entre SSR y client.
Fix: .toFixed(4) + parseFloat() en x1, y1, x2, y2 del return dentro del Array.from.

## Booking System Logic (para entender BookingSection.tsx)
Step machine: 'date' → 'slot' → 'form' → 'confirmed' | 'blocked'
OAuth recovery: sessionStorage key 'bgbarber_pending_booking' = {date, slot}
  Guardado en handleSelectSlot si !user → restaurado en onAuthStateChange SIGNED_IN event
Active booking check: query Supabase en onAuthStateChange → step 'blocked' si hay cita futura
SLOT_TAKEN error → setSlotRefreshKey(k+1) → TimeSlotPicker re-fetch → slot desaparece
Mobile: step-by-step con StepIndicator. Desktop: 2-col con botones "Cambiar" en pills.

## FORGE Documents
- .forge/PROGRESS.md — estado vivo (más importante)
- .forge/PROJECT_BRIEF.md, PLAN.md, CONTRACTS.md, DATA_MODEL.md
- .forge/DECISIONS.md — registro de decisiones
- .forge/MEJORAS_FRAMEWORK.md — feedback sobre el framework FORGE
- .claude/napkin.md — errores y patrones aprendidos
