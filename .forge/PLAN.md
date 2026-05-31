# Project Plan
Generated: 2026-05-31 (FASE 2 — Cliente Premium + Admin Profesional)
Project: BG Barber — SaaS Reservas Premium
Structure: Option A — Modular monolith (Next.js App Router, single Vercel deployment)

## Prerequisitos antes de ejecutar CUALQUIER fase
1. Ejecutar SQL migration 003 en Supabase SQL Editor (proyecto tfnihyxspgtlnlykkxdn)
   SQL: supabase/migrations/003_client_premium.sql
2. npm install resend (en proyecto local)
3. Añadir a .env.local:
   RESEND_API_KEY=re_xxxxxxxxxxxx        (opcional — código degrada sin él)
   RESEND_FROM_EMAIL=citas@bgbarber.es   (o onboarding@resend.dev para pruebas)
   SUPABASE_SERVICE_ROLE_KEY=eyJ...      (Supabase > Settings > API > service_role key)
   CRON_SECRET=<openssl rand -hex 32>    (opcional — cron no funciona sin él)

---

## Phase Overview

| Phase | Name | Depends on | Parallel [P] | Subagent |
|-------|------|------------|--------------|---------|
| 0 | DB Migration + Tipos + Lib helpers | prereqs | — | subagent-foundation |
| 1 | Server Actions + Actions | 0 | — | subagent-actions |
| 2A | API Routes (nuevas) | 0 | [P] con 2B | subagent-api |
| 2B | Email + Cron | 0 | [P] con 2A | subagent-email-cron |
| 3A | Cliente UI (Mis citas) | 1, 2A | [P] con 3B, 3C | subagent-client-ui |
| 3B | Admin UI (agenda + métricas + servicios) | 1, 2A | [P] con 3A, 3C | subagent-admin-ui |
| 3C | Booking flow (BookingSection + NavBar) | 1, 2A | [P] con 3A, 3B | subagent-booking-flow |
| 4 | Verificación + Deploy | 3A, 3B, 3C | — | subagent-verify |

---

## Detailed Phases

### Phase 0 — DB Migration + Tipos + Lib helpers
**Subagent:** subagent-foundation
**Depends on:** prereqs (SQL migration ya ejecutada, resend instalado)
**Parallel:** no — bloquea todas las fases siguientes
**Acceptance criteria:**
- [ ] `supabase/migrations/003_client_premium.sql` creado con schema completo
- [ ] `types/index.ts` actualizado: AppointmentStatus expandido (6 valores), Appointment con nuevos campos, Service, BookingSettings types
- [ ] `lib/whatsapp.ts` creado con cleanPhone(), buildWhatsAppUrl(), helpers contextuales
- [ ] `lib/calendar/ics.ts` creado con generateICS(), downloadICS()
- [ ] `lib/calendar/googleCalendarUrl.ts` creado con buildGoogleCalendarUrl()
- [ ] `lib/email/resend.ts` creado con sendConfirmationEmail, sendCancellationEmail, sendReminderEmail, sendRescheduleNotificationEmail (todas comprueban RESEND_API_KEY antes de enviar)
- [ ] `npx tsc --noEmit` pasa sin errores tras estos cambios
**Estimated time:** 1-2 horas
**Files owned by this subagent:**
- supabase/migrations/003_client_premium.sql
- types/index.ts
- lib/whatsapp.ts
- lib/calendar/ics.ts
- lib/calendar/googleCalendarUrl.ts
- lib/email/resend.ts

**Context crítico para este subagent:**
- Ver NEXT_PHASE_SPEC.md Sección A (SQL), Sección B (tipos), Sección C (helpers)
- appointments.user_id ya es nullable (migration 002)
- 'cancelled' y 'rescheduled' deben estar en el nuevo CHECK constraint para backwards compat
- lib/email/resend.ts: si RESEND_API_KEY no está → console.warn + return {skipped:true}, NUNCA lanzar error

---

### Phase 1 — Server Actions
**Subagent:** subagent-actions
**Depends on:** Phase 0 completada
**Parallel:** no
**Acceptance criteria:**
- [ ] `actions/bookingSettings.ts` creado: getBookingSettings(), updateBookingSetting()
- [ ] `actions/services.ts` creado: adminCreateService(), adminUpdateService(), adminDeleteService()
- [ ] `actions/appointments.ts` modificado:
  - [ ] bookAppointment: eliminado ALREADY_HAS_BOOKING check + añadido BOOKINGS_DISABLED + TOO_SOON
  - [ ] cancelAppointment: validación cancel_hours_before + status cancelled_by_client + email
  - [ ] rescheduleAppointment (nueva): UPDATE in-place, validaciones completas
  - [ ] adminCancelAppointment: status cancelled_by_admin + email
- [ ] `actions/agenda.ts` modificado: + adminRescheduleAppointment, + adminMarkNoShow, + adminMarkCompleted, + adminCopyWeekToNext
- [ ] Todos los server actions retornan error codes exactos de CONTRACTS.md
- [ ] `npx tsc --noEmit` pasa sin errores
**Estimated time:** 2-3 horas
**Files owned by this subagent:**
- actions/bookingSettings.ts (crear)
- actions/services.ts (crear)
- actions/appointments.ts (modificar)
- actions/agenda.ts (modificar)

**Context crítico:**
- Ver NEXT_PHASE_SPEC.md Sección D (server actions con código exacto)
- rescheduleAppointment usa UPDATE in-place: cambia slot_date/start_time/end_time + resetea reminder fields
- adminRescheduleAppointment: mismo UPDATE in-place pero sin restricción temporal + envía email via sendRescheduleNotificationEmail
- Email del cliente en adminCancelAppointment/adminRescheduleAppointment: fetch user email via supabase.auth.admin.getUser(appt.user_id) usando service_role key
- adminCopyWeekToNext: INSERT slots con fechas +7 días, ON CONFLICT DO NOTHING, contar created vs skipped

---

### Phase 2A — API Routes nuevas
**Subagent:** subagent-api
**Depends on:** Phase 0
**Parallel:** [P] con Phase 2B
**Acceptance criteria:**
- [ ] `app/api/services/route.ts` GET — servicios activos, auth none
- [ ] `app/api/admin/services/route.ts` GET + POST — admin only
- [ ] `app/api/admin/services/[id]/route.ts` PATCH + DELETE — admin only
- [ ] `app/api/admin/client-history/route.ts` GET ?phone — admin only, stats agrupados
- [ ] `app/api/admin/metrics/route.ts` GET — admin only, todas las métricas del contrato
- [ ] `app/api/appointments/mine/route.ts` MODIFICADO — devuelve todos los campos nuevos
- [ ] `app/api/admin/status/route.ts` GET (NEW) — admin only, estado de servicios opcionales
- [ ] Todos retornan status codes correctos (200/201/400/401/404)
- [ ] npx tsc --noEmit pasa
**Estimated time:** 2.5 horas
**Files owned by this subagent:**
- app/api/services/route.ts (crear)
- app/api/admin/services/route.ts (crear)
- app/api/admin/services/[id]/route.ts (crear)
- app/api/admin/client-history/route.ts (crear)
- app/api/admin/metrics/route.ts (crear)
- app/api/appointments/mine/route.ts (modificar)
- app/api/admin/status/route.ts (crear)

**Context crítico:**
- Ver CONTRACTS.md para response shapes exactos
- client-history: busca por client_phone en appointments, agrupa stats: {total, completed, cancelled, noShow, lastVisit}
- metrics occupancyRate = confirmed / (confirmed + freeSlots) últimos 30 días
- metrics topClients: top 5 por count de citas completed, agrupados por client_phone
- /api/admin/status: comprueba en SERVER !!process.env.RESEND_API_KEY, !!process.env.CRON_SECRET, !!process.env.SUPABASE_SERVICE_ROLE_KEY + lee booking_settings bookings_enabled/reminders_enabled
  Response: { resend: boolean, cron: boolean, serviceRole: boolean, bookingsEnabled: boolean, remindersEnabled: boolean }

---

### Phase 2B — Email + Cron endpoint
**Subagent:** subagent-email-cron
**Depends on:** Phase 0 (lib/email/resend.ts ya existe)
**Parallel:** [P] con Phase 2A
**Acceptance criteria:**
- [ ] `app/api/cron/reminders/route.ts` creado (ver CONTRACTS.md para lógica exacta)
- [ ] Protegido con CRON_SECRET header check
- [ ] Procesa ventana 24h: appointments confirmed con slot_date = tomorrow, reminder_24h_sent_at IS NULL
- [ ] Procesa ventana 2h: appointments confirmed con slot_datetime dentro de 2h, reminder_2h_sent_at IS NULL
- [ ] Para cada cita: fetch user email via supabase admin (service_role), llamar sendReminderEmail, UPDATE reminder_*_sent_at
- [ ] Walk-ins (user_id IS NULL) omitidos
- [ ] Respeta booking_settings: reminders_enabled, reminder_24h_enabled, reminder_2h_enabled
- [ ] `vercel.json` creado con cron schedule "0 8 * * *" apuntando a /api/cron/reminders
- [ ] npx tsc --noEmit pasa
**Estimated time:** 1.5 horas
**Files owned by this subagent:**
- app/api/cron/reminders/route.ts (crear)
- vercel.json (crear o modificar si existe)

**Context crítico:**
- SUPABASE_SERVICE_ROLE_KEY necesario para acceder a auth.users.email
- createClient para service_role: usar createClient() con { auth: { autoRefreshToken: false, persistSession: false } } y SERVICE_ROLE_KEY
- Si CRON_SECRET no está en env → return 401
- Si RESEND_API_KEY no está → log warning, return 200 con processed=0

---

### Phase 3A — Cliente UI (Mis citas)
**Subagent:** subagent-client-ui
**Depends on:** Phase 1 + Phase 2A
**Parallel:** [P] con Phase 3B y 3C
**Acceptance criteria:**
- [ ] `app/mis-citas/page.tsx` creado — layout completo: próxima cita destacada + historial
- [ ] `components/client/MisCitasCard.tsx` — card por cita con todos los estado badges
- [ ] `components/client/CancelConfirmModal.tsx` — dialog de confirmación de cancelación
- [ ] `components/client/RescheduleModal.tsx` — modal multipaso reutilizando BookingCalendar + TimeSlotPicker
- [ ] `components/client/AddToCalendarButton.tsx` — dropdown 3 opciones (Google / iCal / Outlook)
- [ ] Cancelar dentro de ventana → llama cancelAppointment → toast success → página refresca
- [ ] Cancelar fuera de ventana → botón deshabilitado + mensaje + link WhatsApp
- [ ] Reprogramar dentro de ventana → RescheduleModal → llama rescheduleAppointment → success
- [ ] Reprogramar fuera de ventana → botón deshabilitado + WhatsApp
- [ ] Calendar export → Google abre nueva pestaña, iCal/Outlook descarga .ics
- [ ] Historial muestra estado badge correcto para cada status
- [ ] Estado vacío si no hay citas
- [ ] Estilo: paleta dark gold del proyecto, mismos patrones que AgendaDayPanel
- [ ] npx tsc --noEmit pasa
**Estimated time:** 3-4 horas
**Files owned by this subagent:**
- app/mis-citas/page.tsx
- components/client/MisCitasCard.tsx
- components/client/CancelConfirmModal.tsx
- components/client/RescheduleModal.tsx
- components/client/AddToCalendarButton.tsx

**Context crítico:**
- Ver NEXT_PHASE_SPEC.md Sección F para layouts y lógica exacta
- RescheduleModal: excluir slot actual si misma fecha que la cita a reprogramar
- Badge estados: confirmed=verde, cancelled_by_client=rojo dim, cancelled_by_admin=naranja dim, no_show=rojo, completed=gris ✓
- Fetch /api/appointments/mine + /api/settings (para business_name/whatsapp) al montar
- canCancelOrReschedule check: (apptDateTime - now) / 3600000 >= settings.cancel/reschedule_hours_before

---

### Phase 3B — Admin UI (agenda + métricas + servicios)
**Subagent:** subagent-admin-ui
**Depends on:** Phase 1 + Phase 2A
**Parallel:** [P] con Phase 3A y 3C
**Acceptance criteria:**
- [ ] `components/admin/agenda/AgendaModal.tsx` — añadidos modos: reschedule-appointment, mark-no-show, mark-completed, client-history
- [ ] `components/admin/agenda/AgendaSlotRow.tsx` — nuevos botones hover por estado + visual states para nuevos status + WhatsApp importado de lib/whatsapp.ts
- [ ] `components/admin/agenda/AgendaDayPanel.tsx` — nuevas props pasadas a AgendaSlotRow
- [ ] `components/admin/agenda/AgendaWeekNav.tsx` — botón "Copiar semana →" con feedback
- [ ] `app/admin/agenda/page.tsx` — nuevos openers para modal
- [ ] `components/admin/AdminMetrics.tsx` — grid de métricas, fetch /api/admin/metrics
- [ ] `app/admin/page.tsx` — AdminMetrics encima de AppointmentsList
- [ ] `app/admin/services/page.tsx` — CRUD completo de servicios (lista + crear + editar + toggle activo + borrar)
- [ ] `app/admin/settings/page.tsx` EXPANDIDO — añadir secciones de booking_settings + status bar (NO tocar secciones existentes de imágenes)
- [ ] `components/admin/AdminNav.tsx` — link "Servicios" con icono Scissors (link "Ajustes" ya existe, no duplicar)
- [ ] Reschedule admin: BookingCalendar + TimeSlotPicker, sin restricción de horas
- [ ] No-show: confirmación simple → adminMarkNoShow
- [ ] Completed: confirmación simple → adminMarkCompleted
- [ ] Client history: fetch /api/admin/client-history?phone → muestra lista + stats
- [ ] Copy week: llamada a adminCopyWeekToNext → toast con resultado
- [ ] `app/admin/settings/page.tsx` EXPANDIDO — 3 nuevas secciones debajo de las existentes:
  - [ ] **Estado de servicios** — status bar: fetch /api/admin/status → pills verde/rojo para Resend, Cron, Service Role Key, con mensaje de cómo configurar si no conectado
  - [ ] **Reglas de reservas** — formulario: bookings_enabled toggle, min_hours_advance, cancel_hours_before, reschedule_hours_before, advance_booking_days (llama updateBookingSetting)
  - [ ] **Notificaciones / Recordatorios** — reminders_enabled, reminder_24h_enabled, reminder_2h_enabled (llama updateBookingSetting, deshabilitado si Resend no conectado)
- [ ] npx tsc --noEmit pasa
**Estimated time:** 5-6 horas
**Files owned by this subagent:**
- components/admin/agenda/AgendaModal.tsx
- components/admin/agenda/AgendaSlotRow.tsx
- components/admin/agenda/AgendaDayPanel.tsx
- components/admin/agenda/AgendaWeekNav.tsx
- app/admin/agenda/page.tsx
- components/admin/AdminMetrics.tsx
- app/admin/page.tsx
- app/admin/services/page.tsx
- app/admin/settings/page.tsx (MODIFICAR — expandir, NO reescribir lo que ya existe)
- components/admin/AdminNav.tsx

**Context crítico:**
- Ver NEXT_PHASE_SPEC.md Sección G para modal modes y visual states exactos
- AgendaSlotRow: importar buildWhatsAppUrl desde lib/whatsapp.ts (quitar función inline)
- Estados visuales nuevos: cancelled_by_admin = naranja dim rgba(255,160,50,0.06), completed = gris oscuro, no_show = rojo intenso
- AgendaModal RescheduleAppointmentForm: usar BookingCalendar + TimeSlotPicker importados (ya existen)
- Services page: tabla simple con toggle is_active, edición inline o modal, confirmación antes de borrar
- AdminMetrics: cards compactas, números grandes gold, sin gráficas
- Settings page: leer app/admin/settings/page.tsx antes de modificar — tiene SettingsManager con gallery_enabled + before_after_enabled + image upload. Añadir secciones DEBAJO, no reemplazar
- Status bar pills: verde = "Conectado", rojo = "No configurado" + texto pequeño "Añade RESEND_API_KEY a .env.local"
- Booking settings fields: inputs numéricos con label, guardar al perder foco (onBlur) o botón Save por sección

---

### Phase 3C — Booking flow (BookingSection + NavBar)
**Subagent:** subagent-booking-flow
**Depends on:** Phase 1 + Phase 2A
**Parallel:** [P] con Phase 3A y 3B
**Acceptance criteria:**
- [ ] `components/landing/BookingSection.tsx` modificado:
  - [ ] Step 'blocked' eliminado del step machine
  - [ ] Lógica ALREADY_HAS_BOOKING eliminada del onAuthStateChange
  - [ ] Warning dialog "ya tienes X citas" antes de confirmar segunda cita
  - [ ] Errores nuevos: BOOKINGS_DISABLED, TOO_SOON añadidos a ERROR_MESSAGES
  - [ ] Dropdown de servicios fetch desde /api/services (reemplaza array SERVICES hardcodeado)
- [ ] `components/landing/TimeSlotPicker.tsx` modificado:
  - [ ] Acepta prop minHoursAdvance (default 2)
  - [ ] Filtra del listado slots con slot_datetime - now < minHoursAdvance
- [ ] `components/landing/NavBar.tsx` verificado/modificado:
  - [ ] Link "Mis citas" apunta a /mis-citas
  - [ ] Solo visible cuando user !== null
  - [ ] Desaparece al logout
- [ ] npx tsc --noEmit pasa
**Estimated time:** 2 horas
**Files owned by this subagent:**
- components/landing/BookingSection.tsx
- components/landing/TimeSlotPicker.tsx
- components/landing/NavBar.tsx

**Context crítico:**
- Ver NEXT_PHASE_SPEC.md Sección J y M
- BookingSection: el warning dialog aparece SOLO si el usuario ya tiene ≥1 cita confirmed futura
- BookingSection: servicios vienen de /api/services → { id, name, price_eur } → label "Nombre — Xprecio€"
- Si /api/services falla → fallback al array hardcodeado para no romper el booking
- TimeSlotPicker: el filtro de min_hours_advance es CLIENT-SIDE, solo visual — la validación real está en bookAppointment action

---

### Phase 4 — Verificación + Deploy
**Subagent:** subagent-verify
**Depends on:** Phase 3A + 3B + 3C completadas
**Parallel:** no
**Acceptance criteria:**
- [ ] `npx tsc --noEmit` → output vacío (0 errores TypeScript)
- [ ] No hay imports rotos ni undefined imports
- [ ] `git status` limpio (todo commiteable)
- [ ] `git commit` con mensaje descriptivo
- [ ] `git push` a main → Vercel auto-deploy triggerado
- [ ] Verificar en Vercel dashboard que el build pasa
- [ ] Si hay errores de build: diagnosticar y corregir en esta misma fase
**Estimated time:** 30 min
**Files owned by this subagent:**
- Solo puede modificar archivos para corregir errores TypeScript o imports rotos
- NO puede crear nuevas features ni cambiar lógica

---

## Total estimate
Size: Medium-Large
Total time range: 1 sesión grande (6-8 horas) o 2 sesiones medianas
Main risk: AgendaModal crecimiento (muchos modos nuevos en un solo componente) + cron email integration (service_role key + Resend config)

---

# POST-16 — Visual Overhaul + Admin Reorganización
Generated: 2026-05-31
Approved discovery: tipografía + calendario landing + admin restructura completa + horarios backend

## Prerequisitos POST-16
- Fases 0–4 completadas (commit cec29e4 en prod)
- No migration nueva necesaria (schedule_template va en booking_settings como JSON key)

## Phase Overview POST-16

| Subagente | Scope | Parallel | Archivos propios |
|---|---|---|---|
| P16-A | Tipografía — globals + landing headings | [P] todos | globals.css, HeroSection, ServicesSection, AboutSection, BeforeAfterSection, GallerySection |
| P16-B | Calendario landing — BookingCalendar redesign | [P] todos | BookingCalendar.tsx, BookingSection.tsx |
| P16-C | Admin nav + nueva estructura de rutas | [P] todos | AdminNav.tsx, layout.tsx, media/page.tsx (nueva), ajustes/page.tsx (nueva), settings→redirect, gallery→redirect, before-after→redirect |
| P16-D | Admin Agenda mensual | [P] todos | admin/page.tsx, MonthlyCalendarGrid.tsx (nueva), MonthCalNav.tsx (nueva), api/admin/agenda/route.ts, agenda/page.tsx→redirect |
| P16-G | Admin Horarios — backend + redesign | [P] todos | actions/scheduleTemplate.ts, api/admin/schedule-template/route.ts, ScheduleManager.tsx, schedule/page.tsx |

Todos ejecutan en paralelo — cero archivos compartidos.

---

## Detailed Phases POST-16

### P16-A — Tipografía
**Subagent:** subagent-p16-typography
**Parallel:** sí [P] — sin dependencias con otros subagentes
**Acceptance criteria:**
- [ ] `app/globals.css`: font-size base HTML de 17px → 19px
- [ ] `app/globals.css`: utility class `.text-display` → `clamp(2.2rem, 5vw + 0.5rem, 4.5rem)`
- [ ] `app/globals.css`: utility class `.text-section-title` → `clamp(1.6rem, 3vw + 0.3rem, 2.8rem)`
- [ ] `app/globals.css`: utility class `.text-subsection` → `clamp(1.1rem, 2vw + 0.2rem, 1.6rem)`
- [ ] `components/landing/HeroSection.tsx`: heading principal usa `.text-display` o `clamp()` directo, no `text-4xl` fijo
- [ ] `components/landing/ServicesSection.tsx`: section title usa `.text-section-title`
- [ ] `components/landing/AboutSection.tsx`: heading usa `.text-section-title`
- [ ] `components/landing/BeforeAfterSection.tsx`: heading usa `.text-section-title`
- [ ] `components/landing/GallerySection.tsx`: heading usa `.text-section-title`
- [ ] Textos con estilo especial ("El corte que te define", dancing script decorativos) → NO tocar
- [ ] En móvil (375px): headings de sección mínimo 24px visualmente
- [ ] En desktop (1440px): headings de sección mínimo 40px visualmente
- [ ] `npx tsc --noEmit` pasa sin errores
**Files owned:**
- app/globals.css
- components/landing/HeroSection.tsx
- components/landing/ServicesSection.tsx
- components/landing/AboutSection.tsx
- components/landing/BeforeAfterSection.tsx
- components/landing/GallerySection.tsx

---

### P16-B — Calendario Landing
**Subagent:** subagent-p16-calendar
**Parallel:** sí [P]
**Acceptance criteria:**
- [ ] `components/landing/BookingCalendar.tsx` rediseñado:
  - [ ] Fondo del calendario: blanco `#FFFFFF` o off-white `#F8F5F0`
  - [ ] Texto de días: oscuro `#1a1814` o similar, legible sobre fondo claro
  - [ ] Días disponibles (con slots libres): accent gold `#C9A96E` en número del día o underline
  - [ ] Día seleccionado: fill `#C9A96E` con texto oscuro
  - [ ] Días sin slots / pasados: gris claro `#C0B9AF` o similar, no clickable
  - [ ] Headers de semana (L M X J V S D): texto gris oscuro `#7A7268`
  - [ ] Navegación mes anterior/siguiente: botones visibles sobre fondo claro
  - [ ] Border-radius del contenedor: 20px mínimo, sombra suave
  - [ ] En móvil: calendario ocupa 100% del ancho disponible, sin overflow
  - [ ] En desktop: calendario no excede 400px de ancho
- [ ] `components/landing/BookingSection.tsx`:
  - [ ] Contenedor del calendario tiene suficiente padding para que el fondo claro contraste bien con el fondo oscuro `#0E0B08` de la página
  - [ ] Step machine (date→slot→form→confirmed) funciona igual que antes
  - [ ] Sin bugs visuales al navegar entre meses
- [ ] Flujo de reserva completo funciona: seleccionar fecha → ver slots → reservar
- [ ] `npx tsc --noEmit` pasa
**Files owned:**
- components/landing/BookingCalendar.tsx
- components/landing/BookingSection.tsx

---

### P16-C — Admin Nav + Estructura de Rutas
**Subagent:** subagent-p16-admin-nav
**Parallel:** sí [P]
**Acceptance criteria:**
- [ ] `components/admin/AdminNav.tsx` reescrito:
  - [ ] Desktop (md+): top sticky nav con 5 links: Agenda `/admin` | Servicios `/admin/services` | Media `/admin/media` | Horarios `/admin/schedule` | Ajustes `/admin/ajustes`
  - [ ] Mobile (<md): top bar muestra solo logo + "Panel Admin" + botón salir; bottom tab bar fijo con los mismos 5 links (iconos + labels cortos)
  - [ ] Bottom tab bar: posición `fixed bottom-0 left-0 right-0 z-50`, altura mínima 60px, safe area en iOS (`pb-safe` o `padding-bottom: env(safe-area-inset-bottom)`)
  - [ ] Active state correcto en ambas navs (top y bottom)
  - [ ] Link "Volver al sitio" y "Salir" presentes en desktop, accesibles en mobile (top bar)
- [ ] `app/admin/layout.tsx` modificado:
  - [ ] Main content tiene `pb-20 md:pb-0` para no quedar tapado por bottom tab bar en mobile
- [ ] `app/admin/media/page.tsx` creado:
  - [ ] Página funcional con tabs: "Galería" | "Antes / Después" | "Imágenes del sitio"
  - [ ] Tab Galería: renderiza `<GalleryManager />` (importado de components/admin/GalleryManager.tsx)
  - [ ] Tab Antes/Después: renderiza `<BeforeAfterManager />` (importado de components/admin/BeforeAfterManager.tsx)
  - [ ] Tab Imágenes del sitio: renderiza `<SettingsManager />` (importado, pero solo la parte de imágenes — hero + portrait)
  - [ ] Tabs son botones visibles, active tab highlight con gold
  - [ ] En mobile: tabs con scroll horizontal si necesario, nunca overflow
- [ ] `app/admin/ajustes/page.tsx` creado:
  - [ ] Contiene TODA la lógica de settings actual: estado sistema + reglas reservas + recordatorios + visibilidad secciones (gallery_enabled, before_after_enabled)
  - [ ] Importa y usa los mismos fetches/actions que la settings page actual
  - [ ] Mismo estilo visual que el resto del admin
- [ ] `app/admin/settings/page.tsx` → redirect HTTP 308 a `/admin/ajustes` (usando `redirect()` de next/navigation) o `<Redirect>` component
- [ ] `app/admin/gallery/page.tsx` → redirect a `/admin/media`
- [ ] `app/admin/before-after/page.tsx` → redirect a `/admin/media`
- [ ] En mobile (375px): bottom tab bar labels no se cortan, iconos tamaño mínimo 20px
- [ ] Tap en tab navega correctamente, no requiere doble tap
- [ ] `npx tsc --noEmit` pasa
**Files owned:**
- components/admin/AdminNav.tsx
- app/admin/layout.tsx
- app/admin/media/page.tsx (crear)
- app/admin/ajustes/page.tsx (crear)
- app/admin/settings/page.tsx (redirect only)
- app/admin/gallery/page.tsx (redirect only)
- app/admin/before-after/page.tsx (redirect only)

---

### P16-D — Admin Agenda Mensual
**Subagent:** subagent-p16-agenda
**Parallel:** sí [P]
**Acceptance criteria:**
- [ ] `app/admin/page.tsx` reescrito completamente:
  - [ ] Cabecera: resumen numérico (citas confirmadas hoy + esta semana, calculado del mismo fetch de agenda)
  - [ ] Navegación mes: botones ← mes anterior / mes siguiente / "Hoy"
  - [ ] Grid mensual 7 columnas (L M X J V S D): renderiza todos los días del mes visible
  - [ ] Cada celda de día: número del día + si tiene citas → dot gold + count badge
  - [ ] Días sin slots ni citas → celda vacía con número en gris
  - [ ] Día seleccionado → highlighted con borde gold
  - [ ] Clic en día → `selectedDate` state se actualiza → panel de día se muestra
  - [ ] Panel de día (debajo del grid en mobile, lateral sticky en desktop lg+):
    - [ ] Header: fecha en formato largo ("Jueves, 4 de junio")
    - [ ] Lista de slots del día usando `<AgendaSlotRow />` (reutilizado tal cual)
    - [ ] Botón "Añadir franja" → abre `<AgendaModal mode=bulk-creator>` para ese día
    - [ ] Si no hay slots: mensaje "Sin franjas este día" + botón crear
  - [ ] `<AgendaModal />` y `<AgendaDayPanel />` reutilizados sin modificación
  - [ ] Toda la funcionalidad de crear/editar/bloquear/cancelar slots se mantiene
- [ ] `components/admin/agenda/MonthlyCalendarGrid.tsx` creado:
  - [ ] Props: `{ days: AgendaDay[], selectedDate: string|null, onSelectDate: (date:string)=>void, month: Date }`
  - [ ] Grid 7 columnas, filas = semanas del mes
  - [ ] Días del mes anterior/siguiente: mostrar en gris muy tenue (no clickables)
  - [ ] Mobile: cada celda mínimo 44×44px, texto legible
  - [ ] No hace overflow horizontal en ningún viewport
- [ ] `components/admin/agenda/MonthCalNav.tsx` creado:
  - [ ] Props: `{ currentMonth: Date, onPrev: ()=>void, onNext: ()=>void, onToday: ()=>void }`
  - [ ] Muestra "Mayo 2026" o similar, botones flecha + "Hoy"
- [ ] `app/api/admin/agenda/route.ts` modificado:
  - [ ] Límite de 14 días eliminado → acepta hasta 31 días (1 mes)
  - [ ] Validación de rango: si `to - from > 31 días`, devuelve 400
- [ ] `app/admin/agenda/page.tsx` → redirect a `/admin`
- [ ] En desktop (1024px+): grid mes a la izquierda, panel día sticky derecha (2 columnas)
- [ ] En mobile: grid mes arriba, panel día debajo (scroll normal)
- [ ] `npx tsc --noEmit` pasa
**Files owned:**
- app/admin/page.tsx
- components/admin/agenda/MonthlyCalendarGrid.tsx (crear)
- components/admin/agenda/MonthCalNav.tsx (crear)
- app/api/admin/agenda/route.ts
- app/admin/agenda/page.tsx (redirect only)

---

### P16-G — Admin Horarios Backend + Redesign
**Subagent:** subagent-p16-schedule
**Parallel:** sí [P]
**Acceptance criteria:**
- [ ] `actions/scheduleTemplate.ts` creado:
  - [ ] `getScheduleTemplate()` → lee `booking_settings` key `schedule_template` → parsea JSON → devuelve `{ day, start_time, end_time }[]` o `[]` si vacío
  - [ ] `saveScheduleTemplate(template)` → valida (day 0-6, HH:MM, end>start) → escribe en booking_settings como JSON → revalida `/admin/schedule`
  - [ ] `generateSlotsFromTemplate(startDate: string, weeks: number)` → lee template → para cada fecha en rango → si día-semana coincide → inserta slots de 30 min (startTime to endTime) → ON CONFLICT DO NOTHING → devuelve `{ created, skipped }`
- [ ] `app/api/admin/schedule-template/route.ts` creado:
  - [ ] GET: admin only → llama getScheduleTemplate() → 200 `{ template }`
  - [ ] 401 si no admin
- [ ] `components/admin/ScheduleManager.tsx` rediseñado:
  - [ ] **Sección 1 — Mini calendario**: muestra mes actual con dots en días que ya tienen availability_slots (fetch `/api/admin/agenda?from=&to=` primer día del mes al último)
  - [ ] Navegación mes en mini calendario
  - [ ] **Sección 2 — Plantilla semanal**: 7 checkboxes (Lunes…Domingo) + para cada día activado: time picker start + end
  - [ ] Botón "Guardar plantilla" → llama saveScheduleTemplate
  - [ ] **Sección 3 — Generador**: date picker "Desde" + selector "Semanas" (1-12) + botón "Generar franjas" → llama generateSlotsFromTemplate → toast con resultado `"X franjas creadas, Y ya existían"`
  - [ ] **Sección 4 — Creación manual**: bulk creator existente (`<SlotBulkCreator />`) para crear franjas de un día específico
  - [ ] En mobile: secciones apiladas verticalmente, inputs mínimo 44px de alto
  - [ ] Botones de acción min 44px de alto en mobile
- [ ] `app/admin/schedule/page.tsx` actualizado para usar nuevo ScheduleManager
- [ ] La generación de slots no rompe slots existentes (ON CONFLICT DO NOTHING)
- [ ] Toast de resultado visible en mobile y desktop
- [ ] `npx tsc --noEmit` pasa
**Files owned:**
- actions/scheduleTemplate.ts (crear)
- app/api/admin/schedule-template/route.ts (crear)
- components/admin/ScheduleManager.tsx
- app/admin/schedule/page.tsx

---

## Dependency graph POST-16
```
Todos paralelos — sin dependencias entre sí
P16-A ─┐
P16-B ─┤
P16-C ─┼── ejecutar simultáneamente → merge → verify + deploy
P16-D ─┤
P16-G ─┘
```

## Notas de solapes resueltos
- Citas+Agenda: /admin/agenda desaparece (redirect), /admin absorbe toda la funcionalidad
- Galería+Antes/Después+Imágenes: todo en /admin/media con tabs
- Settings caótico: se divide en /admin/media (fotos) + /admin/ajustes (configuración)
- Nav 7 ítems → 5 ítems limpios, bottom tab bar en mobile

## Notas responsive (requisito crítico)
- Bottom tab bar: safe area inset en iOS, no tapa contenido
- Calendarios (landing + admin mensual): sin overflow horizontal, celdas mínimo 44×44px
- Todos los botones de acción: mínimo 44px alto en mobile (táctil)
- Ningún elemento con width fijo > 375px
- clamp() en tipografía: nunca rompe en 320px ni en 2560px

## Total estimate POST-16
Size: Large (puro diseño/UX + 1 pieza backend)
Parallel execution: 5 subagentes simultáneos
Main risk: P16-C (nav restructura con bottom bar + redirects) + P16-D (agenda mensual desde cero)

## Dependency graph
```
prereqs
  └── Phase 0 (foundation)
        ├── Phase 1 (actions)     ←── blocks 3A, 3B, 3C
        ├── Phase 2A (api)        ←── blocks 3A, 3B, 3C
        └── Phase 2B (email-cron) ← parallel con 2A, no bloquea UI
              Phase 3A ─┐
              Phase 3B ─┼── parallel entre sí
              Phase 3C ─┘
                    └── Phase 4 (verify + deploy)
```
