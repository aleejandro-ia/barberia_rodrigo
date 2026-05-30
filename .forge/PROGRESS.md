# Project Progress
# Last updated: 2026-05-30
# Session: Carousel infinite belt + Booking system redesign

## Executive Summary
Barbería BG Barber — app de reservas premium para Rodrigo Bargueño. Todas las fases originales completas. Post-launch: tipografía (Plus Jakarta Sans 17px), galería infinita (marquee belt), y sistema de reservas completamente rediseñado con step machine, OAuth recovery via sessionStorage, y corrección de bugs críticos. Pendiente: fix hydration error en AboutSection.tsx.

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
   Iteraciones:
     1. 3D circular carousel (original)
     2. Slide-by-slide translateX (descartado — usuario quería movimiento continuo)
     3. FINAL: Infinite marquee belt continuo
   Implementación final:
     - RAF loop: posRef -= AUTO_SPEED (0.45px/frame, ~27px/seg)
     - Triple array ([...slots, ...slots, ...slots]) para contenido continuo
     - Seamless reset: if posRef <= -totalW → posRef += totalW
     - Drag + inercia: pointer events, FRICTION 0.92
     - Edge fades: gradiente bg izq/der (#161310)
     - Mismo card style portrait 280×400, borde gold

✅ POST-7 — Booking system redesign completo [completed 2026-05-30]

   BUGS CORREGIDOS:
   1. /api/availability/dates - ahora filtra fechas completamente llenas
      Antes: devolvía potentialDates sin usar bookedMap
      Ahora: filtra por fecha con al menos 1 slot no reservado
   2. BookingCalendar - límite 3 meses adelante (canGoNext)
   3. TimeSlotPicker - prop refreshKey para re-fetch desde parent
      También muestra duración "10:00 – hasta 10:30"
      Estado de error de red con botón Reintentar
   4. BookingSection - reescrito con step machine:
      Step machine: 'date' | 'slot' | 'form' | 'confirmed' | 'blocked'

   NUEVAS FEATURES:
   - OAuth recovery: sessionStorage guarda {date, slot} antes de redirect Google
     Al volver, SIGNED_IN event restaura el slot automáticamente
   - Active booking check: onAuthStateChange query Supabase → step 'blocked' si existe cita
   - BlockedState component: muestra cita existente + instrucción "Mis citas"
   - Mobile: step-by-step con StepIndicator (1→2→3) + back buttons
   - Desktop: 2-col + botones "Cambiar" en pills de fecha/hora
   - SLOT_TAKEN → setSlotRefreshKey(k+1) → TimeSlotPicker refetch → slot desaparece
   - FormFields extraído como subcomponente reutilizable
   - Hint teléfono: "Incluye el prefijo (+34 para España)"

   Archivos modificados:
     app/api/availability/dates/route.ts
     components/landing/BookingCalendar.tsx
     components/landing/TimeSlotPicker.tsx
     components/landing/BookingSection.tsx

🔄 POST-8 — Hydration error en AboutSection [PENDIENTE FIX]
   Error: React hydration mismatch en SVG TICKS array (~línea 30)
   Causa: Math.cos/Math.sin con Math.PI → floats distintos Node.js vs V8 browser
   Fix conocido: aplicar .toFixed(4) + parseFloat() a x1, y1, x2, y2 en Array.from return
   Estado: identificado, NO arreglado

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

## Key Files
app/page.tsx — composición landing
app/layout.tsx — Plus Jakarta Sans + Dancing Script, metadata BG Barber
app/globals.css — Tailwind v4, font-size 17px
app/auth/callback/route.ts — OAuth callback, redirectTo next param
app/api/availability/dates/route.ts — fechas disponibles (CORREGIDO: filtra llenas)
app/api/availability/slots/route.ts — slots disponibles para una fecha
components/landing/GalleryCarousel.tsx — infinite marquee belt (RAF + triple array)
components/landing/GallerySection.tsx — usa GalleryCarousel, fetch /api/gallery
components/landing/BookingSection.tsx — step machine completo, OAuth recovery
components/landing/BookingCalendar.tsx — calendario con maxMonth 3 meses
components/landing/TimeSlotPicker.tsx — slots con refreshKey + duración
components/landing/AboutSection.tsx — ⚠️ hydration bug en TICKS (pendiente)
proxy.ts — middleware Next.js 16 (NO tocar)
lib/auth.ts — isAdmin() → alejandronopez@gmail.com
actions/appointments.ts — bookAppointment server action
supabase/migrations/ — NO modificar

## EXACT NEXT STEP
Arreglar hydration error en components/landing/AboutSection.tsx.
Buscar el array TICKS (~línea 30), en el return del Array.from aplicar:
  x1: parseFloat((cx + rOuter * Math.cos(angleRad)).toFixed(4)),
  y1: parseFloat((cy + rOuter * Math.sin(angleRad)).toFixed(4)),
  x2: parseFloat((cx + rInner * Math.cos(angleRad)).toFixed(4)),
  y2: parseFloat((cy + rInner * Math.sin(angleRad)).toFixed(4)),
Luego verificar en consola que no aparezca hydration warning.
