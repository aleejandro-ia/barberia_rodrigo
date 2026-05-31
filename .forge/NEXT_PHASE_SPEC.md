# Spec: Fase 2 — Cliente Premium + Admin Profesional + Notificaciones
# Versión: 2.0 (definitiva)
# Redactado: 2026-05-31
# Estado: PENDIENTE EJECUCIÓN

## Contexto del proyecto

BG Barber es un **producto SaaS replicable para peluquerías**, no una barbería hobby.
El objetivo es que cualquier peluquería pueda adoptar este sistema.
Rodrigo lo usa como instancia piloto.

Lógica de negocio inamovible:
- Rodrigo abre huecos manualmente cuando quiere cortar (no calendario automático)
- Los clientes solo ven y reservan esos huecos
- Admin controla todo desde `/admin/agenda`

Antes de tocar código, leer:
- `AGENTS.md` — stack, archivos clave, convenciones
- `.forge/PROGRESS.md` — estado real del repo
- `types/index.ts` — tipos actuales
- `actions/appointments.ts` — lógica server actual
- `actions/agenda.ts` — acciones admin actuales
- `components/admin/agenda/AgendaModal.tsx` — modal admin actual (7 modos)
- `components/admin/agenda/AgendaSlotRow.tsx` — fila slot admin actual
- `supabase/migrations/001_initial_schema.sql` — schema base
- `supabase/migrations/002_agenda_phase1.sql` — cambios phase 1

---

## Alcance completo

| Feature | Incluido | Notas |
|---|---|---|
| "Mis citas" page cliente | ✅ | /mis-citas — nueva página |
| Cancelación con reglas configurables | ✅ | booking_settings.cancel_hours_before |
| Reprogramación por cliente | ✅ | UPDATE in-place, ventana temporal |
| Calendar export (.ics + Google Calendar) | ✅ | sin dependencias externas |
| WhatsApp helper centralizado | ✅ | lib/whatsapp.ts |
| Estados: cancelled_by_client, cancelled_by_admin | ✅ | backwards compatible |
| Estado: no_show | ✅ | admin lo marca |
| Estado: completed | ✅ | admin lo marca |
| Estado: rescheduled | ✅ | trazabilidad, UPDATE in-place |
| booking_settings tabla | ✅ | configurable por negocio |
| Múltiples citas por usuario | ✅ | warning UI, sin bloqueo server |
| Admin: reprogramar cita desde agenda | ✅ | nuevo modo modal |
| Admin: marcar no-show | ✅ | nuevo modo modal |
| Admin: marcar completed | ✅ | nuevo modo modal |
| Admin: historial cliente inline | ✅ | en modal de cita confirmed |
| Email con Resend | ✅ | requiere RESEND_API_KEY en .env.local |
| Email admin→cliente al reprogramar | ✅ | "tu cita ha sido cambiada a X" |
| Email admin→cliente al cancelar | ✅ | "tu cita ha sido cancelada por el barbero" |
| Recordatorios 24h/2h (Vercel Cron) | ✅ | endpoint + vercel.json cron |
| Métricas admin dashboard | ✅ | sección en /admin |
| Catálogo de servicios configurable | ✅ | tabla services, admin gestiona desde /admin/services |
| Copiar semana → siguiente semana | ✅ | botón en AgendaWeekNav |
| min_hours_advance en booking_settings | ✅ | filtro en bookAppointment + picker |
| bookings_enabled en booking_settings | ✅ | pausa global de reservas |

---

## SECCIÓN A — DB Migration 003

**Archivo:** `supabase/migrations/003_client_premium.sql`
**Ejecutar ANTES que cualquier código en Supabase SQL Editor (proyecto tfnihyxspgtlnlykkxdn)**

```sql
-- ============================================================
-- BARBERÍA BG BARBER — Migration 003: Client Premium + SaaS
-- ============================================================

-- 1. Expandir CHECK constraint de status
--    'confirmed' y 'cancelled' existentes siguen funcionando
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'confirmed',
    'cancelled',
    'cancelled_by_client',
    'cancelled_by_admin',
    'rescheduled',
    'completed',
    'no_show'
  ));

-- 2. Campos de trazabilidad en appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_at               timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason        text,
  ADD COLUMN IF NOT EXISTS rescheduled_at             timestamptz,
  ADD COLUMN IF NOT EXISTS previous_slot_date         date,
  ADD COLUMN IF NOT EXISTS previous_slot_start_time   time,
  ADD COLUMN IF NOT EXISTS completed_at               timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at       timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at        timestamptz;

-- 3. Tabla booking_settings (reglas configurables por negocio)
CREATE TABLE IF NOT EXISTS public.booking_settings (
  key         text        PRIMARY KEY,
  value       text        NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.booking_settings (key, value, description) VALUES
  ('cancel_hours_before',     '3',
   'Horas mínimas antes de la cita para cancelar online'),
  ('reschedule_hours_before', '3',
   'Horas mínimas antes de la cita para reprogramar online'),
  ('advance_booking_days',    '90',
   'Máximo días adelante que se puede reservar'),
  ('whatsapp_phone',          '34600000000',
   'Teléfono WhatsApp barbero (con prefijo país, sin +)'),
  ('business_name',           'BG Barber',
   'Nombre del negocio (aparece en emails y mensajes)'),
  ('business_location',       '',
   'Dirección del negocio (para calendario y emails)'),
  ('whatsapp_cancel_msg',
   'Hola, necesito cancelar mi cita pero está fuera del plazo online. ¿Me puedes ayudar?',
   'Mensaje WA cuando cliente no puede cancelar online'),
  ('whatsapp_reschedule_msg',
   'Hola, me gustaría cambiar mi cita. ¿Tienes disponibilidad?',
   'Mensaje WA cuando cliente no puede reprogramar online'),
  ('reminders_enabled',       'true',
   'Activar recordatorios automáticos por email'),
  ('reminder_24h_enabled',    'true',
   'Recordatorio 24h antes de la cita'),
  ('reminder_2h_enabled',     'true',
   'Recordatorio 2h antes de la cita')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_settings_select_public"
  ON public.booking_settings FOR SELECT USING (true);

CREATE POLICY "booking_settings_insert_admin"
  ON public.booking_settings FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "booking_settings_update_admin"
  ON public.booking_settings FOR UPDATE USING (public.is_admin());

-- 4. Eliminar RLS policy de 1 cita activa por usuario
--    El límite pasa a ser warning en UI, no bloqueo en DB
DROP POLICY IF EXISTS "appointments_insert_authenticated_one_active"
  ON public.appointments;

CREATE POLICY "appointments_insert_authenticated"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- 5. Índices nuevos para queries de métricas y recordatorios
CREATE INDEX IF NOT EXISTS idx_appointments_user_status_date
  ON public.appointments (user_id, status, slot_date);

CREATE INDEX IF NOT EXISTS idx_appointments_reminders
  ON public.appointments (slot_date, slot_start_time, status)
  WHERE status = 'confirmed'
    AND reminder_24h_sent_at IS NULL;
```

---

## SECCIÓN B — Nuevos tipos TypeScript

**Archivo:** `types/index.ts` — MODIFICAR

```typescript
export type AppointmentStatus =
  | 'confirmed'
  | 'cancelled'
  | 'cancelled_by_client'
  | 'cancelled_by_admin'
  | 'rescheduled'
  | 'completed'
  | 'no_show'

export interface Appointment {
  id: string
  user_id?: string | null
  slot_date: string
  slot_start_time: string
  slot_end_time: string
  client_name: string
  client_phone: string
  notes?: string
  status: AppointmentStatus
  created_at: string
  // Trazabilidad (pueden ser null en registros anteriores)
  cancelled_at?: string | null
  cancellation_reason?: string | null
  rescheduled_at?: string | null
  previous_slot_date?: string | null
  previous_slot_start_time?: string | null
  completed_at?: string | null
  reminder_24h_sent_at?: string | null
  reminder_2h_sent_at?: string | null
}

export interface BookingSettings {
  cancel_hours_before: number
  reschedule_hours_before: number
  advance_booking_days: number
  whatsapp_phone: string
  business_name: string
  business_location: string
  whatsapp_cancel_msg: string
  whatsapp_reschedule_msg: string
  reminders_enabled: boolean
  reminder_24h_enabled: boolean
  reminder_2h_enabled: boolean
}

// Helpers de estado
export function isActiveFutureAppointment(appt: Appointment, today: string): boolean {
  return appt.status === 'confirmed' && appt.slot_date >= today
}

export function isCancelledStatus(status: AppointmentStatus): boolean {
  return status === 'cancelled' || status === 'cancelled_by_client' || status === 'cancelled_by_admin'
}
```

---

## SECCIÓN C — Helpers de librería

### `lib/whatsapp.ts` — CREAR

Centraliza TODA la lógica WhatsApp. Actualizar `AgendaSlotRow.tsx` para importar desde aquí.

```typescript
export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (/^[6789]\d{8}$/.test(digits)) return `34${digits}`
  if (/^34[6789]\d{8}$/.test(digits)) return digits
  return digits
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`
}

// Mensajes contextuales
export function whatsAppReminder(phone: string, name: string, date: string, time: string): string {
  return buildWhatsAppUrl(phone, `Hola ${name}, te recuerdo tu cita en BG Barber el ${date} a las ${time}. ¡Te esperamos!`)
}

export function whatsAppCancelOutOfTime(phone: string, msg: string): string {
  return buildWhatsAppUrl(phone, msg)
}

export function whatsAppRescheduleOutOfTime(phone: string, msg: string): string {
  return buildWhatsAppUrl(phone, msg)
}
```

### `lib/calendar/ics.ts` — CREAR

```typescript
export interface CalendarEvent {
  title: string
  date: string        // 'YYYY-MM-DD'
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
  description?: string
  location?: string
}

function fmt(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateICS(event: CalendarEvent): string {
  const uid = `${Date.now()}-bgbarber@bgbarber.es`
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BG Barber//Booking//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`, `DTSTAMP:${now}Z`,
    `DTSTART;TZID=Europe/Madrid:${fmt(event.date, event.startTime)}`,
    `DTEND;TZID=Europe/Madrid:${fmt(event.date, event.endTime)}`,
    `SUMMARY:${esc(event.title)}`,
    event.description ? `DESCRIPTION:${esc(event.description)}` : '',
    event.location    ? `LOCATION:${esc(event.location)}`       : '',
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de cita en BG Barber', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

export function downloadICS(event: CalendarEvent): void {
  const blob = new Blob([generateICS(event)], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'cita-bgbarber.ics'; a.click()
  URL.revokeObjectURL(url)
}
```

### `lib/calendar/googleCalendarUrl.ts` — CREAR

```typescript
import type { CalendarEvent } from './ics'

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const fmt = (d: string, t: string) => `${d.replace(/-/g, '')}T${t.replace(':', '')}00`
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     event.title,
    dates:    `${fmt(event.date, event.startTime)}/${fmt(event.date, event.endTime)}`,
    details:  event.description ?? '',
    location: event.location ?? '',
    ctz:      'Europe/Madrid',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
```

### `lib/email/resend.ts` — CREAR

```typescript
/**
 * PREREQUISITO: npm install resend
 * ENV VARS necesarias:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx        (desde resend.com → API Keys)
 *   RESEND_FROM_EMAIL=citas@tudominio.com (o onboarding@resend.dev para pruebas)
 */
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export interface AppointmentEmailData {
  to:        string    // email del cliente
  name:      string
  date:      string    // formato legible "Viernes, 5 de junio de 2026"
  time:      string    // "10:00"
  service?:  string
  business:  string    // booking_settings.business_name
}

export async function sendConfirmationEmail(data: AppointmentEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return { skipped: true }
  }
  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: `Cita confirmada en ${data.business}`,
    html:    buildConfirmationHtml(data),
  })
}

export async function sendCancellationEmail(data: AppointmentEmailData) {
  if (!process.env.RESEND_API_KEY) return { skipped: true }
  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: `Cita cancelada en ${data.business}`,
    html:    buildCancellationHtml(data),
  })
}

export async function sendReminderEmail(data: AppointmentEmailData, type: '24h' | '2h') {
  if (!process.env.RESEND_API_KEY) return { skipped: true }
  const hoursText = type === '24h' ? 'mañana' : 'en 2 horas'
  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: `Recordatorio: tienes cita ${hoursText} en ${data.business}`,
    html:    buildReminderHtml(data, hoursText),
  })
}

// ─── HTML templates (dark, gold, premium) ──────────────────────
function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{background:#0E0B08;font-family:sans-serif;color:#F2EDE7;margin:0;padding:0}
    .container{max-width:480px;margin:40px auto;padding:32px;background:#161310;border-radius:16px;border:1px solid rgba(201,169,110,0.15)}
    h1{color:#C9A96E;font-size:20px;margin:0 0 24px}
    .row{margin:8px 0;font-size:15px;color:#7A7268}
    .row span{color:#F2EDE7;font-weight:600}
    .footer{margin-top:32px;font-size:12px;color:#3A3530;text-align:center}
  </style></head><body><div class="container">
    <h1>${title}</h1>${body}
    <div class="footer">BG Barber — Sistema de reservas</div>
  </div></body></html>`
}

function buildConfirmationHtml(d: AppointmentEmailData): string {
  return baseHtml('✓ Cita confirmada', `
    <p>Hola ${d.name}, tu cita está confirmada.</p>
    <div class="row">Fecha: <span>${d.date}</span></div>
    <div class="row">Hora: <span>${d.time}</span></div>
    ${d.service ? `<div class="row">Servicio: <span>${d.service}</span></div>` : ''}
    <div class="row">Barbería: <span>${d.business}</span></div>
  `)
}

function buildCancellationHtml(d: AppointmentEmailData): string {
  return baseHtml('Cita cancelada', `
    <p>Hola ${d.name}, tu cita ha sido cancelada.</p>
    <div class="row">Fecha: <span>${d.date}</span></div>
    <div class="row">Hora: <span>${d.time}</span></div>
    <p style="color:#7A7268;font-size:14px">Si quieres reservar otra cita, visita la web.</p>
  `)
}

function buildReminderHtml(d: AppointmentEmailData, hoursText: string): string {
  return baseHtml(`Recordatorio — cita ${hoursText}`, `
    <p>Hola ${d.name}, te recordamos tu cita ${hoursText}.</p>
    <div class="row">Fecha: <span>${d.date}</span></div>
    <div class="row">Hora: <span>${d.time}</span></div>
    ${d.service ? `<div class="row">Servicio: <span>${d.service}</span></div>` : ''}
    <div class="row">Barbería: <span>${d.business}</span></div>
  `)
}
```

---

## SECCIÓN D — Server actions

### `actions/bookingSettings.ts` — CREAR

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import type { BookingSettings } from '@/types'

export async function getBookingSettings(): Promise<BookingSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('booking_settings').select('key, value')
  const m: Record<string, string> = {}
  for (const row of data ?? []) m[row.key] = row.value
  return {
    cancel_hours_before:     parseInt(m.cancel_hours_before     ?? '3'),
    reschedule_hours_before: parseInt(m.reschedule_hours_before ?? '3'),
    advance_booking_days:    parseInt(m.advance_booking_days    ?? '90'),
    whatsapp_phone:          m.whatsapp_phone          ?? '34600000000',
    business_name:           m.business_name           ?? 'BG Barber',
    business_location:       m.business_location       ?? '',
    whatsapp_cancel_msg:     m.whatsapp_cancel_msg     ?? 'Hola, necesito cancelar mi cita.',
    whatsapp_reschedule_msg: m.whatsapp_reschedule_msg ?? 'Hola, me gustaría cambiar mi cita.',
    reminders_enabled:       (m.reminders_enabled      ?? 'true') === 'true',
    reminder_24h_enabled:    (m.reminder_24h_enabled   ?? 'true') === 'true',
    reminder_2h_enabled:     (m.reminder_2h_enabled    ?? 'true') === 'true',
  }
}

export async function updateBookingSetting(key: keyof BookingSettings, value: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }
  const supabase = await createClient()
  await supabase.from('booking_settings').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return { success: true as const }
}
```

### `actions/appointments.ts` — MODIFICAR

**Cambios exactos:**

1. **`bookAppointment`**: eliminar bloque "Check user has no active future booking" (~líneas 44-51). Mantener resto intacto.

2. **`cancelAppointment`**: añadir validación ventana temporal + nuevo status + email:
```typescript
export async function cancelAppointment(appointmentId: string) {
  const user = await getUser()
  if (!user) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, user_id, status, slot_date, slot_start_time, client_name, client_phone, notes')
    .eq('id', appointmentId).maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.user_id !== user.id) return { error: 'NOT_OWNER' as const }
  if (appt.status !== 'confirmed') return { error: 'ALREADY_CANCELLED' as const }

  // Validar ventana temporal
  const settings = await getBookingSettings()
  const apptDT   = new Date(`${appt.slot_date}T${appt.slot_start_time}`)
  const hoursUntil = (apptDT.getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil < settings.cancel_hours_before) return { error: 'CANCEL_TOO_LATE' as const }

  await supabase.from('appointments').update({
    status:      'cancelled_by_client',
    cancelled_at: new Date().toISOString(),
  }).eq('id', appointmentId)

  // Email (si Resend configurado + user tiene email)
  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const userEmail = user.email
  if (userEmail) {
    const { sendCancellationEmail } = await import('@/lib/email/resend')
    await sendCancellationEmail({
      to: userEmail, name: appt.client_name,
      date: appt.slot_date, time: appt.slot_start_time.slice(0, 5),
      service: appt.notes, business: settings.business_name,
    })
  }

  revalidatePath('/')
  revalidatePath('/mis-citas')
  return { success: true as const }
}
```

3. **`adminCancelAppointment`**: cambiar status a `cancelled_by_admin` + grabar `cancelled_at` + email:
```typescript
await supabase.from('appointments').update({
  status:       'cancelled_by_admin',
  cancelled_at: new Date().toISOString(),
}).eq('id', appointmentId)
// + enviar email si hay user_id y email disponible
```

4. **Nueva `rescheduleAppointment` (cliente)**:
```typescript
export async function rescheduleAppointment(
  appointmentId: string,
  newSlot: { slot_date: string; slot_start_time: string; slot_end_time: string }
) {
  const user = await getUser()
  if (!user) return { error: 'UNAUTHORIZED' as const }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, user_id, status, slot_date, slot_start_time')
    .eq('id', appointmentId).maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.user_id !== user.id) return { error: 'NOT_OWNER' as const }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' as const }

  // Ventana temporal
  const settings = await getBookingSettings()
  const apptDT   = new Date(`${appt.slot_date}T${appt.slot_start_time}`)
  const hoursUntil = (apptDT.getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil < settings.reschedule_hours_before) return { error: 'RESCHEDULE_TOO_LATE' as const }

  // Nuevo slot libre
  const today = new Date().toISOString().split('T')[0]
  if (newSlot.slot_date < today) return { error: 'VALIDATION_ERROR' as const }

  const { data: slot } = await supabase
    .from('availability_slots')
    .select('id').eq('date', newSlot.slot_date)
    .eq('start_time', newSlot.slot_start_time).eq('is_available', true).maybeSingle()
  if (!slot) return { error: 'SLOT_NOT_FOUND' as const }

  const { data: taken } = await supabase
    .from('appointments').select('id')
    .eq('slot_date', newSlot.slot_date)
    .eq('slot_start_time', newSlot.slot_start_time)
    .eq('status', 'confirmed').maybeSingle()
  if (taken) return { error: 'SLOT_TAKEN' as const }

  // UPDATE in-place — el slot viejo queda libre automáticamente
  await supabase.from('appointments').update({
    slot_date:                newSlot.slot_date,
    slot_start_time:          newSlot.slot_start_time,
    slot_end_time:            newSlot.slot_end_time,
    rescheduled_at:           new Date().toISOString(),
    previous_slot_date:       appt.slot_date,
    previous_slot_start_time: appt.slot_start_time,
    reminder_24h_sent_at:     null,   // reset recordatorios para nueva fecha
    reminder_2h_sent_at:      null,
  }).eq('id', appointmentId)

  revalidatePath('/')
  revalidatePath('/mis-citas')
  return { success: true as const }
}
```

### `actions/agenda.ts` — MODIFICAR: añadir 3 acciones

```typescript
// adminRescheduleAppointment — sin restricción de horas
export async function adminRescheduleAppointment(
  appointmentId: string,
  newSlot: { slot_date: string; slot_start_time: string; slot_end_time: string }
) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }
  const supabase = await createClient()

  const { data: appt } = await supabase
    .from('appointments').select('id, status, slot_date, slot_start_time, client_name, user_id')
    .eq('id', appointmentId).maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' as const }

  const { data: taken } = await supabase
    .from('appointments').select('id')
    .eq('slot_date', newSlot.slot_date)
    .eq('slot_start_time', newSlot.slot_start_time)
    .eq('status', 'confirmed').maybeSingle()
  if (taken) return { error: 'SLOT_TAKEN' as const }

  await supabase.from('appointments').update({
    slot_date:                newSlot.slot_date,
    slot_start_time:          newSlot.slot_start_time,
    slot_end_time:            newSlot.slot_end_time,
    rescheduled_at:           new Date().toISOString(),
    previous_slot_date:       appt.slot_date,
    previous_slot_start_time: appt.slot_start_time,
    reminder_24h_sent_at:     null,
    reminder_2h_sent_at:      null,
  }).eq('id', appointmentId)

  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  revalidatePath('/mis-citas')
  return { success: true as const }
}

// adminMarkNoShow
export async function adminMarkNoShow(appointmentId: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }
  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments').select('id, status').eq('id', appointmentId).maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' as const }
  await supabase.from('appointments').update({ status: 'no_show' }).eq('id', appointmentId)
  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  return { success: true as const }
}

// adminMarkCompleted
export async function adminMarkCompleted(appointmentId: string) {
  const user = await getUser()
  if (!isAdmin(user)) return { error: 'UNAUTHORIZED' as const }
  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments').select('id, status').eq('id', appointmentId).maybeSingle()
  if (!appt) return { error: 'NOT_FOUND' as const }
  if (appt.status !== 'confirmed') return { error: 'NOT_CONFIRMED' as const }
  await supabase.from('appointments').update({
    status:       'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', appointmentId)
  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  return { success: true as const }
}
```

---

## SECCIÓN E — API routes nuevas/modificadas

### `app/api/appointments/mine/route.ts` — MODIFICAR

Devolver todos los campos necesarios para "Mis citas":
```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    id, slot_date, slot_start_time, slot_end_time,
    client_name, client_phone, notes, status, created_at,
    cancelled_at, rescheduled_at, previous_slot_date,
    previous_slot_start_time, completed_at
  `)
  .eq('user_id', user.id)
  .order('slot_date', { ascending: false })
  .order('slot_start_time', { ascending: false })
```

### `app/api/admin/client-history/route.ts` — CREAR

```
GET ?phone=XXXXXXXXX
```
Devuelve historial de citas agrupado por teléfono (sin crear tabla clients separada):
```typescript
// Admin only. Busca por client_phone normalizado.
// Devuelve: { appointments: Appointment[], stats: { total, completed, cancelled, noShow } }
```

### `app/api/cron/reminders/route.ts` — CREAR

Endpoint para Vercel Cron. Protegido con `CRON_SECRET`:
```typescript
// 1. Verificar Authorization: Bearer ${CRON_SECRET}
// 2. Leer booking_settings: reminders_enabled, reminder_24h_enabled, reminder_2h_enabled
// 3. Si reminders_enabled=false → return 200 sin hacer nada
// 4. Query appointments confirmed donde slot_date/time está en window 24h y reminder_24h_sent_at IS NULL
// 5. Para cada uno: sendReminderEmail + UPDATE reminder_24h_sent_at = now()
// 6. Repetir para window 2h con reminder_2h_sent_at
// 7. Requiere user email → join con auth.users via supabase service_role o profiles.email si existe
```

**NOTA:** El email del cliente viene de `auth.users`. Para accederlo en server actions se puede usar:
```typescript
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appt.user_id)
// supabaseAdmin = createClient con SERVICE_ROLE_KEY
```
Añadir `SUPABASE_SERVICE_ROLE_KEY` a `.env.local` para el cron (solo usado server-side).

### `app/api/admin/metrics/route.ts` — CREAR

```
GET (admin only)
```
Devuelve métricas operativas:
```typescript
{
  today: { confirmed, completed, noShow },
  thisWeek: { confirmed, completed, cancelled, noShow },
  upcoming7days: number,
  freeSlots7days: number,
  occupancyRate: number,          // confirmed / (confirmed + free) últimos 30 días
  topClients: { name, phone, count }[]  // top 5 por número de citas completadas
}
```

---

## SECCIÓN F — Componentes cliente nuevos

### `app/mis-citas/page.tsx` — CREAR ('use client')

**Layout:**
```
Header: "Mis citas" + subtítulo
──────────────────────────────
Sección "Próxima cita" (si hay confirmed futura):
  Card grande gold-border:
  - Fecha prominente + hora gold
  - Servicio (notes)
  - Badge estado
  - Botones: [📅 Añadir al calendario] [✏️ Cambiar cita] [✕ Cancelar]
  - Si fuera de plazo: botones Cambiar/Cancelar grises + link WhatsApp
──────────────────────────────
Sección "Historial" (citas pasadas/canceladas):
  Lista compacta, badge por estado, orden desc
──────────────────────────────
Empty state: "Aún no tienes citas" + botón ir a #reservar
```

**Modal discriminated union:**
```typescript
type MisCitasModal =
  | { type: 'closed' }
  | { type: 'cancel';     appointment: Appointment }
  | { type: 'reschedule'; appointment: Appointment }
  | { type: 'calendar';   appointment: Appointment }
```

**Lógica de ventana temporal:**
```typescript
function canCancelOrReschedule(appt: Appointment, settings: BookingSettings, action: 'cancel' | 'reschedule'): boolean {
  const hours = action === 'cancel'
    ? settings.cancel_hours_before
    : settings.reschedule_hours_before
  const apptDT = new Date(`${appt.slot_date}T${appt.slot_start_time}`)
  return (apptDT.getTime() - Date.now()) / (1000 * 60 * 60) >= hours
}
```

### `components/client/MisCitasCard.tsx` — CREAR
Card individual de cita. Estados visuales:
- `confirmed` → borde gold, badge verde "Confirmada"
- `cancelled_by_client` → rojo dim "Cancelada por ti"
- `cancelled_by_admin` → naranja dim "Cancelada por el barbero"
- `no_show` → rojo "No asististe"
- `completed` → gris "Completada" ✓
- `rescheduled` → obsoleto (no debería quedar en DB, todos se hacen UPDATE in-place)

### `components/client/CancelConfirmModal.tsx` — CREAR
Dialog: "¿Cancelar tu cita?" + fecha/hora + "Esta acción no se puede deshacer" + botones.
En submit: llama `cancelAppointment(id)` → toast success/error.

### `components/client/RescheduleModal.tsx` — CREAR
Modal multipaso que reutiliza `BookingCalendar` y `TimeSlotPicker`.
Paso 1: elegir fecha → Paso 2: elegir slot → Paso 3: confirmar cambio.
En confirmar: llama `rescheduleAppointment(id, newSlot)`.
IMPORTANTE: excluir slot actual si misma fecha (el cliente no puede "reprogramar al mismo hueco").

### `components/client/AddToCalendarButton.tsx` — CREAR
Dropdown tres opciones: Google Calendar (nueva pestaña), Apple/iCal (.ics download), Outlook (.ics download).
```typescript
function appointmentToCalendarEvent(appt: Appointment, businessName: string): CalendarEvent {
  return {
    title:       `Cita en ${businessName}`,
    date:        appt.slot_date,
    startTime:   appt.slot_start_time.slice(0, 5),
    endTime:     appt.slot_end_time.slice(0, 5),
    description: appt.notes ? `Servicio: ${appt.notes}` : undefined,
  }
}
```

---

## SECCIÓN G — Admin panel: nuevos modos modal + cambios agenda

### `components/admin/agenda/AgendaModal.tsx` — MODIFICAR

Añadir al union type:
```typescript
| { type: 'reschedule-appointment'; appointment: Appointment }
| { type: 'mark-no-show';          appointment: Appointment }
| { type: 'mark-completed';        appointment: Appointment }
| { type: 'client-history';        appointment: Appointment }
```

Nuevos forms a añadir dentro del modal:

**`RescheduleAppointmentForm`:**
Reutiliza `BookingCalendar` + `TimeSlotPicker`. Sin restricción de horas (admin puede mover cualquier cita).
Llama `adminRescheduleAppointment(appointment.id, newSlot)`.

**`MarkNoShowForm`:**
Confirmación: "Marcar a {nombre} como no presentado?"
Llama `adminMarkNoShow(appointment.id)`.

**`MarkCompletedForm`:**
Confirmación: "Marcar cita de {nombre} como completada?"
Llama `adminMarkCompleted(appointment.id)`.

**`ClientHistoryPanel`:**
Fetch `/api/admin/client-history?phone={appt.client_phone}`.
Muestra lista de citas anteriores del mismo número (sin crear tabla clients).
Stats: total citas, completadas, canceladas, no-shows.

### `components/admin/agenda/AgendaSlotRow.tsx` — MODIFICAR

Para citas `confirmed`:
- Añadir botón "Cambiar slot" (ArrowsClockwise) → abre `reschedule-appointment`
- Añadir botón "No-show" (UserMinus) → abre `mark-no-show`
- Añadir botón "Ver cliente" (User) → abre `client-history`

Para citas en cualquier estado pasado (slot_date < today + confirmed):
- Añadir botón "Completada" (CheckCircle) → abre `mark-completed`

Actualizar visual states para nuevos estados:
- `cancelled_by_client` → igual que `cancelled` actual (rojo dim)
- `cancelled_by_admin` → naranja dim `rgba(255,160,50,0.06)`, borde naranja dim
- `no_show` → rojo más intenso, badge "No-show"
- `completed` → gris/verde apagado, badge "✓"

**Actualizar WhatsApp inline** para importar desde `lib/whatsapp.ts` (quitar función buildWhatsAppUrl inline).

Nuevas props: `onRescheduleAppointment`, `onMarkNoShow`, `onMarkCompleted`, `onClientHistory`.

### `components/admin/agenda/AgendaDayPanel.tsx` — MODIFICAR
Añadir nuevas props y pasarlas a `AgendaSlotRow`.

### `app/admin/agenda/page.tsx` — MODIFICAR
Añadir handlers: `openRescheduleAppointment`, `openMarkNoShow`, `openMarkCompleted`, `openClientHistory`.

---

## SECCIÓN H — Métricas admin

### `components/admin/AdminMetrics.tsx` — CREAR

Componente de métricas para incrustar en `/admin` page arriba de la lista de citas.
Fetch `/api/admin/metrics` al montar.

Layout: grid de cards pequeñas (4-6 métricas clave):
```
[Citas hoy: X]  [Esta semana: X]  [No-shows: X]  [Completadas: X]
[Huecos libres próx. 7 días: X]  [Ocupación: X%]
```
Estilo: cards compactas dark gold, números prominentes, sin gráficas complejas.

### `app/admin/page.tsx` — MODIFICAR
Añadir `<AdminMetrics />` encima de `<AppointmentsList />`.

---

## SECCIÓN I — Recordatorios con Vercel Cron

### `app/api/cron/reminders/route.ts` — CREAR

```typescript
// GET y POST (Vercel Cron usa GET)
// Protección: Authorization: Bearer ${process.env.CRON_SECRET}
// Lógica completa documentada en SECCIÓN E
```

### `vercel.json` — CREAR o MODIFICAR

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```
Ejecuta a las 8:00 UTC (10:00 España verano) cada día.
Procesa recordatorios 24h para citas del día siguiente y 2h para citas del mismo día.

### Env vars nuevas necesarias:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=citas@bgbarber.es
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (Supabase Dashboard > Settings > API > service_role)
CRON_SECRET=random_secret_string  (genera con: openssl rand -hex 32)
```

---

## SECCIÓN J — Cambios en BookingSection

### `components/landing/BookingSection.tsx` — MODIFICAR

1. **Quitar `'blocked'` step** del step machine o convertirlo en estado informativo (no bloqueante).
2. **Quitar lógica `ALREADY_HAS_BOOKING`** del `onAuthStateChange`.
3. **Añadir warning multi-cita**: tras autenticarse, si user tiene confirmed futures → mostrar dialog antes de confirmar nueva reserva:
   ```
   "Ya tienes {N} cita(s) activa(s)"
   "¿Seguro que quieres añadir otra?"
   [Ver mis citas] [Añadir de todas formas]
   ```
4. **Actualizar `ERROR_MESSAGES`**: quitar `ALREADY_HAS_BOOKING` o actualizar mensaje.

### `components/landing/NavBar.tsx` — VERIFICAR/MODIFICAR

Confirmar que "Mis citas" link:
- Apunta a `/mis-citas`
- Solo aparece cuando `user !== null`
- Desaparece cuando el usuario hace logout

---

## SECCIÓN K — Catálogo de servicios

### DB: añadir a migration 003

```sql
-- Tabla services (catálogo configurable por negocio)
CREATE TABLE IF NOT EXISTS public.services (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  price_eur        numeric(6,2) NOT NULL DEFAULT 0,
  duration_minutes integer     NOT NULL DEFAULT 30,
  is_active        boolean     NOT NULL DEFAULT true,
  display_order    integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Datos por defecto (BG Barber)
INSERT INTO public.services (name, price_eur, duration_minutes, display_order) VALUES
  ('Corte Clásico',   7.00, 30, 1),
  ('Corte',           9.00, 30, 2),
  ('Corte con Barba', 10.00, 45, 3)
ON CONFLICT DO NOTHING;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_public"
  ON public.services FOR SELECT USING (true);

CREATE POLICY "services_insert_admin"
  ON public.services FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "services_update_admin"
  ON public.services FOR UPDATE USING (public.is_admin());

CREATE POLICY "services_delete_admin"
  ON public.services FOR DELETE USING (public.is_admin());
```

### Tipo Service en `types/index.ts`:
```typescript
export interface Service {
  id: string
  name: string
  price_eur: number
  duration_minutes: number
  is_active: boolean
  display_order: number
}
```

### Estrategia de almacenamiento:
- `appointments.notes` sigue siendo el campo donde se guarda el servicio seleccionado
- Al reservar, el cliente elige del catálogo → el nombre del servicio se guarda en `notes`
- Sin FK en appointments → backwards compatible, walk-ins pueden tener notas libres
- El catálogo solo provee las opciones del dropdown

### Archivos nuevos para servicios:
```
app/api/admin/services/route.ts       — GET lista + POST crear
app/api/services/route.ts             — GET lista pública (para BookingSection)
actions/services.ts                   — adminCreateService, adminUpdateService, adminDeleteService
app/admin/services/page.tsx           — CRUD admin (nueva página)
components/admin/AdminNav.tsx         — añadir link "Servicios" con icono Scissors
```

### `BookingSection.tsx` — actualizar dropdown:
Cambiar `SERVICES` hardcodeado a fetch de `/api/services` al montar.
Mostrar: nombre + precio (ej. "Corte Clásico — 7€").
Solo mostrar servicios donde `is_active = true`, ordenados por `display_order`.

---

## SECCIÓN L — Copiar semana

### `actions/agenda.ts` — añadir `adminCopyWeekToNext`

```typescript
export async function adminCopyWeekToNext(weekStart: string) {
  // weekStart: 'YYYY-MM-DD' (lunes)
  // 1. Fetch todos los slots de la semana weekStart → weekStart+6 días
  // 2. Para cada slot, calcular fecha equivalente en la semana siguiente (+7 días)
  // 3. INSERT slots para la semana siguiente, ON CONFLICT DO NOTHING (no sobreescribe existentes)
  // 4. Retornar { created: N, skipped: M }
  // Admin only. Revalidate /admin/agenda.
}
```

### `components/admin/agenda/AgendaWeekNav.tsx` — añadir botón

Botón "Copiar semana →" junto a los controles prev/next/today.
Al click: llama `adminCopyWeekToNext(weekStart)` → toast "X franjas creadas para la semana siguiente".
Si hay error o 0 creadas: "La semana siguiente ya tiene franjas para esos horarios."

---

## SECCIÓN M — booking_settings adicionales

Añadir a la migration 003 y al tipo `BookingSettings`:

```sql
INSERT INTO public.booking_settings (key, value, description) VALUES
  ('min_hours_advance', '2',    'Horas mínimas de antelación para reservar'),
  ('bookings_enabled',  'true', 'Activar/desactivar reservas online globalmente')
ON CONFLICT (key) DO NOTHING;
```

```typescript
// En BookingSettings type:
min_hours_advance: number   // default 2
bookings_enabled:  boolean  // default true
```

### `bookAppointment` — añadir validación:
```typescript
// Después de validar slot_date >= today:
const settings = await getBookingSettings()
if (!settings.bookings_enabled) return { error: 'BOOKINGS_DISABLED' as const }

const slotDT = new Date(`${slot_date}T${slot_start_time}`)
const hoursUntil = (slotDT.getTime() - Date.now()) / (1000 * 60 * 60)
if (hoursUntil < settings.min_hours_advance) return { error: 'TOO_SOON' as const }
```

### `TimeSlotPicker` — filtrar slots muy próximos:
Recibir `minHoursAdvance` como prop. Filtrar del listado los slots que ya no cumplen la ventana.

### `BookingSection` — error messages nuevos:
```typescript
BOOKINGS_DISABLED: 'Las reservas online están desactivadas temporalmente.',
TOO_SOON: 'Este hueco está demasiado próximo. Reserva con más antelación.',
```

---

## SECCIÓN N — Email admin→cliente al reprogramar

### `lib/email/resend.ts` — añadir función:

```typescript
export interface RescheduleEmailData extends AppointmentEmailData {
  newDate: string
  newTime: string
}

export async function sendRescheduleNotificationEmail(data: RescheduleEmailData) {
  if (!process.env.RESEND_API_KEY) return { skipped: true }
  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: `Tu cita en ${data.business} ha sido cambiada`,
    html:    buildRescheduleHtml(data),
  })
}

function buildRescheduleHtml(d: RescheduleEmailData): string {
  return baseHtml('Cita reprogramada', `
    <p>Hola ${d.name}, tu cita ha sido cambiada.</p>
    <div class="row">Nueva fecha: <span>${d.newDate}</span></div>
    <div class="row">Nueva hora: <span>${d.newTime}</span></div>
    ${d.service ? `<div class="row">Servicio: <span>${d.service}</span></div>` : ''}
    <div class="row">Barbería: <span>${d.business}</span></div>
    <p style="color:#7A7268;font-size:13px">Si tienes alguna duda, contacta por WhatsApp.</p>
  `)
}
```

### `adminRescheduleAppointment` — añadir envío de email:
Después del UPDATE, si `appt.user_id !== null`:
- Fetch email del cliente via supabaseAdmin
- Llamar `sendRescheduleNotificationEmail`

---

## Resumen de archivos

### Crear (22 archivos):
```
supabase/migrations/003_client_premium.sql
lib/whatsapp.ts
lib/calendar/ics.ts
lib/calendar/googleCalendarUrl.ts
lib/email/resend.ts
actions/bookingSettings.ts
actions/services.ts
app/api/services/route.ts
app/api/admin/services/route.ts
app/api/admin/client-history/route.ts
app/api/admin/metrics/route.ts
app/api/cron/reminders/route.ts
app/mis-citas/page.tsx
app/admin/services/page.tsx
components/client/MisCitasCard.tsx
components/client/CancelConfirmModal.tsx
components/client/RescheduleModal.tsx
components/client/AddToCalendarButton.tsx
components/admin/AdminMetrics.tsx
vercel.json
```

### Modificar (13 archivos):
```
types/index.ts
actions/appointments.ts
actions/agenda.ts
app/api/appointments/mine/route.ts
components/landing/BookingSection.tsx
components/landing/TimeSlotPicker.tsx
components/landing/NavBar.tsx
components/admin/AdminNav.tsx
components/admin/agenda/AgendaModal.tsx
components/admin/agenda/AgendaSlotRow.tsx
components/admin/agenda/AgendaDayPanel.tsx
components/admin/agenda/AgendaWeekNav.tsx
app/admin/agenda/page.tsx
app/admin/page.tsx
```

---

## Orden de ejecución recomendado

```
0. Añadir RESEND_API_KEY, RESEND_SERVICE_ROLE_KEY, CRON_SECRET a .env.local
   (si no disponible aún, el código los salta con console.warn — no rompe nada)
1. npm install resend
2. SQL migration 003 en Supabase SQL Editor
3. types/index.ts
4. lib/whatsapp.ts
5. lib/calendar/ics.ts + lib/calendar/googleCalendarUrl.ts
6. lib/email/resend.ts
7. actions/bookingSettings.ts
8. actions/appointments.ts (modificar)
9. actions/agenda.ts (modificar — añadir 3 funciones)
10. app/api/appointments/mine/route.ts (modificar)
11. app/api/admin/client-history/route.ts
12. app/api/admin/metrics/route.ts
13. app/api/cron/reminders/route.ts
14. components/client/*.tsx (4 componentes)
15. app/mis-citas/page.tsx
16. components/landing/BookingSection.tsx
17. components/landing/NavBar.tsx
18. components/admin/AdminMetrics.tsx
19. components/admin/agenda/AgendaModal.tsx
20. components/admin/agenda/AgendaSlotRow.tsx
21. components/admin/agenda/AgendaDayPanel.tsx
22. app/admin/agenda/page.tsx
23. app/admin/page.tsx
24. vercel.json
25. npx tsc --noEmit → 0 errores
26. git commit + push → Vercel auto-deploy
```

---

## Errores de server actions y mensajes UI

| Error | Mensaje al usuario |
|---|---|
| `CANCEL_TOO_LATE` | "Solo puedes cancelar hasta {N}h antes. [Contactar por WhatsApp →]" |
| `RESCHEDULE_TOO_LATE` | "Solo puedes cambiar hasta {N}h antes. [Contactar por WhatsApp →]" |
| `SLOT_TAKEN` | "Ese hueco ya fue reservado. Elige otro." |
| `SLOT_NOT_FOUND` | "El hueco ya no está disponible." |
| `NOT_CONFIRMED` | "Esta cita no se puede modificar." |
| `NOT_OWNER` | "No tienes permiso para modificar esta cita." |
| `NOT_FOUND` | "Cita no encontrada." |

---

## Notas críticas de implementación

1. **Sync admin → cliente**: automático. Mismo DB, mismas filas. Cuando admin cancela/reprograma, el cliente lo ve en "Mis citas" al recargar. No se necesita websockets.

2. **Email sin API key**: todas las funciones de email comprueban `process.env.RESEND_API_KEY`. Si no está → `console.warn` + return `{skipped: true}`. El booking NO falla si el email falla.

3. **Cron sin configurar**: el endpoint `/api/cron/reminders` verifica `CRON_SECRET`. Sin él → 401. El resto del sistema funciona perfectamente sin el cron activo.

4. **`cancelled` legacy**: el CHECK expandido incluye `'cancelled'` → citas antiguas siguen funcionando. La UI los trata igual que `cancelled_by_client`.

5. **Reprogramación UPDATE in-place**: el slot viejo queda libre automáticamente porque ninguna appointment apunta a él. El partial unique index solo bloquea confirmed en (slot_date, slot_start_time) → al actualizar esos campos, el constraint nuevo es el nuevo slot.

6. **Email cliente en reminders**: usar `supabaseAdmin` (service_role) para acceder a `auth.users.email`. Solo en el cron route, nunca en client-side.

7. **`resend` package**: `npm install resend` antes de ejecutar cualquier código de email.

8. **Walk-in sin email**: `adminCreateAppointment` crea citas con `user_id: null`. Estos clientes no tienen email en el sistema → el cron los omite automáticamente al comprobar `user_id IS NOT NULL`.
