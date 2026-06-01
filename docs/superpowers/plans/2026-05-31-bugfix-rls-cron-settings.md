# Bugfix: RLS Cancel + Cron Anon + Update Checks + Booking-Settings API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir 4 bugs que rompen: cancelar cita desde cliente, cron de recordatorios, respuestas falsas de éxito en actions, y desconexión entre settings admin y UI cliente.

**Architecture:**
- Bug 1 (BLOCKER): La policy RLS `appointments_update_admin_or_cancel_own` sin `WITH CHECK` explícito hereda el USING como check post-update → `status='cancelled_by_client'` falla `status='confirmed'` → silencioso. Fix: nueva migration SQL.
- Bug 2 (BLOCKER): Cron usa `createClient()` (anon key, sin sesión) → RLS bloquea SELECT y UPDATE de appointments → siempre devuelve 0/0. Fix: usar `supabaseAdmin` (service_role) para todos los ops de DB en el cron.
- Bug 3 (MEDIUM): `cancelAppointment` y `rescheduleAppointment` no comprueban resultado del UPDATE → devuelven `{ success: true }` aunque la DB no haya cambiado nada.
- Bug 4 (LOW-MEDIUM): `/api/booking-settings` no existe → `mis-citas` usa hardcoded 3h → si admin cambia el valor, UI cliente no se entera.

**Tech Stack:** Next.js 16 App Router, Supabase PostgreSQL con RLS, TypeScript, `@supabase/supabase-js`

---

## File Map

| Archivo | Acción | Motivo |
|---|---|---|
| `supabase/migrations/004_fix_rls_update.sql` | **CREAR** | Corrige policy RLS UPDATE (Bug 1) |
| `actions/appointments.ts` | **MODIFICAR** | Añade `.select('id')` + check resultado en cancel y reschedule (Bug 3) |
| `components/client/CancelConfirmModal.tsx` | **MODIFICAR** | Añade `UPDATE_FAILED` al mapa de mensajes de error |
| `components/client/RescheduleModal.tsx` | **MODIFICAR** | Añade `UPDATE_FAILED` al mapa de mensajes de error |
| `app/api/cron/reminders/route.ts` | **MODIFICAR** | Reemplaza `createClient()` con `supabaseAdmin` para todos los ops DB (Bug 2) |
| `app/api/booking-settings/route.ts` | **CREAR** | Endpoint público que expone subset seguro de booking_settings (Bug 4) |
| `app/mis-citas/page.tsx` | **MODIFICAR** | Pasa `cancelHoursBefore` y `rescheduleHoursBefore` como props a MisCitasCard |
| `components/client/MisCitasCard.tsx` | **MODIFICAR** | Acepta y usa `cancelHoursBefore`/`rescheduleHoursBefore` en `canAct()` |

---

## ⚠️ ORDEN CRÍTICO

**Las Tasks 1 y 2 son SQL — el usuario debe ejecutarlas en Supabase SQL Editor ANTES de hacer deploy del código.**
Tasks 3-8 son código puro y pueden ejecutarse en cualquier orden entre sí, pero no antes de que el SQL esté aplicado en prod.

---

## Task 1: Migration SQL — Corregir RLS UPDATE policy

**Archivos:**
- Crear: `supabase/migrations/004_fix_rls_update.sql`

> ⚠️ Esta migration debe ejecutarse en Supabase SQL Editor ANTES de deployar el código. No hace falta `npx supabase` — pegar directamente en el SQL Editor del proyecto `tfnihyxspgtlnlykkxdn`.

- [ ] **Step 1: Crear archivo de migration**

```sql
-- supabase/migrations/004_fix_rls_update.sql
-- ============================================================
-- Fix: appointments_update_admin_or_cancel_own
--
-- Problema: la policy original no tenía WITH CHECK explícito.
-- PostgreSQL hereda USING como WITH CHECK para UPDATE.
-- Efecto: al cambiar status a 'cancelled_by_client' la fila
-- resultante falla la condición `status = 'confirmed'` → UPDATE
-- bloqueado silenciosamente → action devuelve success pero DB no cambia.
--
-- Fix: WITH CHECK separado que solo verifica propiedad del usuario,
-- sin restricción sobre el status resultante.
-- ============================================================

DROP POLICY IF EXISTS "appointments_update_admin_or_cancel_own" ON public.appointments;

CREATE POLICY "appointments_update_admin_or_cancel_own"
  ON public.appointments FOR UPDATE
  USING (
    -- Solo filas confirmed del propio usuario (o cualquier fila si es admin)
    public.is_admin()
    OR (auth.uid() = user_id AND status = 'confirmed')
  )
  WITH CHECK (
    -- Post-update: solo verificar propiedad (no el status resultante)
    public.is_admin()
    OR auth.uid() = user_id
  );
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Ir a: `https://supabase.com/dashboard/project/tfnihyxspgtlnlykkxdn/sql/new`
Pegar y ejecutar el SQL anterior.
Resultado esperado: `Success. No rows returned`

- [ ] **Step 3: Verificar en Supabase Table Editor**

Ir a Database → Policies → tabla `appointments`.
Confirmar que la policy `appointments_update_admin_or_cancel_own` tiene ahora `WITH CHECK` diferente al `USING`.

- [ ] **Step 4: Commit del archivo de migration**

```bash
git add supabase/migrations/004_fix_rls_update.sql
git commit -m "fix(db): add explicit WITH CHECK to appointments UPDATE policy

Without explicit WITH CHECK, PostgreSQL inherits the USING clause as
post-update check. Status 'cancelled_by_client' failed the inherited
'status = confirmed' condition, silently blocking client cancellations."
```

---

## Task 2: Fix `actions/appointments.ts` — Comprobar resultado de UPDATE

**Archivos:**
- Modificar: `actions/appointments.ts`

> **Dependencia:** Task 1 (migration) debe estar aplicada en DB antes de que este código sea útil. El código se puede escribir antes, pero el cancel seguirá fallando hasta que la migration esté en prod.

- [ ] **Step 1: Corregir `cancelAppointment` — añadir `.select('id')` y check**

Localizar el bloque `await supabase.from('appointments').update({...}).eq('id', appointmentId)` en `cancelAppointment` (línea ~100) y reemplazarlo:

```typescript
  const { data: updated, error: updateError } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled_by_client',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    return { error: 'UPDATE_FAILED' as const }
  }
```

- [ ] **Step 2: Corregir `rescheduleAppointment` — añadir `.select('id')` y check**

Localizar el bloque `await supabase.from('appointments').update({...}).eq('id', appointmentId)` en `rescheduleAppointment` (línea ~176) y reemplazarlo:

```typescript
  const { data: updated, error: updateError } = await supabase
    .from('appointments')
    .update({
      slot_date: newSlot.slot_date,
      slot_start_time: newSlot.slot_start_time,
      slot_end_time: newSlot.slot_end_time,
      rescheduled_at: new Date().toISOString(),
      previous_slot_date: appt.slot_date,
      previous_slot_start_time: appt.slot_start_time,
      reminder_24h_sent_at: null,
      reminder_2h_sent_at: null,
    })
    .eq('id', appointmentId)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    return { error: 'UPDATE_FAILED' as const }
  }
```

- [ ] **Step 3: Verificar TypeScript sin errores**

```bash
npx tsc --noEmit
```

Resultado esperado: 0 errores. Si hay errores de tipo en `ALREADY_HAS_BOOKING` en el return type declaration de `bookAppointment`, ese tipo existe en el union pero nunca se devuelve — es inofensivo (no rompe el build).

- [ ] **Step 4: Commit**

```bash
git add actions/appointments.ts
git commit -m "fix: check update result in cancelAppointment and rescheduleAppointment

Both actions were returning success even when the DB update silently
failed (e.g., RLS block). Now use .select('id') to verify the row
was actually updated."
```

---

## Task 3: Fix modales cliente — Añadir mensaje `UPDATE_FAILED`

**Archivos:**
- Modificar: `components/client/CancelConfirmModal.tsx`
- Modificar: `components/client/RescheduleModal.tsx`

- [ ] **Step 1: Añadir `UPDATE_FAILED` a `CancelConfirmModal`**

En `components/client/CancelConfirmModal.tsx`, localizar el objeto `msgs` en `handleConfirm` y añadir la clave:

```typescript
      const msgs: Record<string, string> = {
        UNAUTHORIZED:     'Debes iniciar sesión.',
        NOT_FOUND:        'Cita no encontrada.',
        NOT_OWNER:        'No tienes permiso.',
        ALREADY_CANCELLED:'Esta cita ya fue cancelada.',
        CANCEL_TOO_LATE:  'Ya no es posible cancelar con tan poca antelación.',
        UPDATE_FAILED:    'No se pudo cancelar. Inténtalo de nuevo.',
      }
```

- [ ] **Step 2: Añadir `UPDATE_FAILED` a `RescheduleModal`**

En `components/client/RescheduleModal.tsx`, localizar el objeto `msgs` en `handleConfirm` y añadir la clave:

```typescript
        const msgs: Record<string, string> = {
          UNAUTHORIZED:        'Debes iniciar sesión.',
          NOT_FOUND:           'Cita no encontrada.',
          NOT_OWNER:           'No tienes permiso.',
          NOT_CONFIRMED:       'Solo puedes reagendar citas confirmadas.',
          RESCHEDULE_TOO_LATE: 'Ya no es posible reagendar con tan poca antelación.',
          SLOT_NOT_FOUND:      'El horario seleccionado ya no está disponible.',
          SLOT_TAKEN:          'El horario seleccionado acaba de ser reservado. Elige otro.',
          VALIDATION_ERROR:    'Datos inválidos.',
          UPDATE_FAILED:       'No se pudo reagendar. Inténtalo de nuevo.',
        }
```

- [ ] **Step 3: Commit**

```bash
git add components/client/CancelConfirmModal.tsx components/client/RescheduleModal.tsx
git commit -m "fix: add UPDATE_FAILED error message to cancel and reschedule modals"
```

---

## Task 4: Fix cron — Usar `supabaseAdmin` para todos los ops de appointments

**Archivos:**
- Modificar: `app/api/cron/reminders/route.ts`

> **Causa del bug:** `createClient()` en un API route sin cookies de usuario → anon client sin sesión → `auth.uid()` = null, `is_admin()` = false → SELECT appointments devuelve vacío (RLS bloquea), UPDATE reminder_sent_at bloqueado silenciosamente. El `supabaseAdmin` (service_role) ya existe en el archivo — solo hay que usarlo para las queries de appointments.

- [ ] **Step 1: Eliminar import de `createClient` y su uso**

Al inicio del archivo, eliminar:
```typescript
import { createClient } from '@/lib/supabase/server'
```

Y eliminar la línea:
```typescript
const supabase = await createClient()
```

- [ ] **Step 2: Reemplazar todos los usos de `supabase` en el cron por `supabaseAdmin`**

El archivo usa `supabase` (anon) para:
1. Leer `booking_settings` — cambiar a `supabaseAdmin`
2. SELECT `appointments` (24h window) — cambiar a `supabaseAdmin`
3. UPDATE `reminder_24h_sent_at` — cambiar a `supabaseAdmin`
4. SELECT `appointments` (2h window) — cambiar a `supabaseAdmin`
5. UPDATE `reminder_2h_sent_at` — cambiar a `supabaseAdmin`

El archivo completo corregido (solo la parte relevante — el resto permanece igual):

```typescript
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/email/resend'

export async function GET(req: Request) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Need service role for all DB ops (no user session in cron context)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('[cron/reminders] SUPABASE_SERVICE_ROLE_KEY not set — skipping')
    return NextResponse.json({ processed24h: 0, processed2h: 0 })
  }

  // Single admin client — service role bypasses RLS for all DB ops
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Read reminder settings (booking_settings has public SELECT, but service role works too)
  const { data: settingsRows } = await supabaseAdmin
    .from('booking_settings')
    .select('key, value')
    .in('key', ['reminders_enabled', 'reminder_24h_enabled', 'reminder_2h_enabled', 'business_name'])

  const s: Record<string, string> = {}
  for (const row of settingsRows ?? []) s[row.key] = row.value

  if ((s.reminders_enabled ?? 'true') === 'false') {
    return NextResponse.json({ processed24h: 0, processed2h: 0 })
  }

  const businessName = s.business_name ?? 'BG Barber'
  const now = new Date()

  // ─── 24h window ──────────────────────────────────────────────
  let processed24h = 0
  if ((s.reminder_24h_enabled ?? 'true') === 'true') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: appts24h } = await supabaseAdmin
      .from('appointments')
      .select('id, user_id, client_name, slot_date, slot_start_time, slot_end_time, notes')
      .eq('status', 'confirmed')
      .eq('slot_date', tomorrowStr)
      .is('reminder_24h_sent_at', null)
      .not('user_id', 'is', null)

    for (const appt of appts24h ?? []) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appt.user_id!)
        if (!user?.email) continue

        await sendReminderEmail({
          to: user.email,
          name: appt.client_name,
          date: appt.slot_date,
          time: appt.slot_start_time.slice(0, 5),
          service: appt.notes ?? undefined,
          business: businessName,
        }, '24h')

        await supabaseAdmin
          .from('appointments')
          .update({ reminder_24h_sent_at: new Date().toISOString() })
          .eq('id', appt.id)

        processed24h++
      } catch (e) {
        console.error('[cron/reminders] 24h error for', appt.id, e)
      }
    }
  }

  // ─── 2h window ───────────────────────────────────────────────
  let processed2h = 0
  if ((s.reminder_2h_enabled ?? 'true') === 'true') {
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const in2hDate = in2h.toISOString().split('T')[0]
    const in2hTime = in2h.toTimeString().slice(0, 5)
    const nowTime  = now.toTimeString().slice(0, 5)

    const { data: appts2h } = await supabaseAdmin
      .from('appointments')
      .select('id, user_id, client_name, slot_date, slot_start_time, slot_end_time, notes')
      .eq('status', 'confirmed')
      .eq('slot_date', in2hDate)
      .gte('slot_start_time', nowTime)
      .lte('slot_start_time', in2hTime)
      .is('reminder_2h_sent_at', null)
      .not('user_id', 'is', null)

    for (const appt of appts2h ?? []) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appt.user_id!)
        if (!user?.email) continue

        await sendReminderEmail({
          to: user.email,
          name: appt.client_name,
          date: appt.slot_date,
          time: appt.slot_start_time.slice(0, 5),
          service: appt.notes ?? undefined,
          business: businessName,
        }, '2h')

        await supabaseAdmin
          .from('appointments')
          .update({ reminder_2h_sent_at: new Date().toISOString() })
          .eq('id', appt.id)

        processed2h++
      } catch (e) {
        console.error('[cron/reminders] 2h error for', appt.id, e)
      }
    }
  }

  return NextResponse.json({ processed24h, processed2h })
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/reminders/route.ts
git commit -m "fix(cron): use service_role client for all DB ops in reminders cron

createClient() in a cron request has no user session cookies,
so auth.uid() is null and is_admin() is false. RLS silently blocked
all appointment SELECTs and UPDATEs. supabaseAdmin (service_role)
bypasses RLS and can access all rows."
```

---

## Task 5: Crear `/api/booking-settings` — Endpoint público de configuración

**Archivos:**
- Crear: `app/api/booking-settings/route.ts`

> Este endpoint expone solo el subset de `booking_settings` que necesita el cliente (horas de cancelación/reprogramación + mensajes WhatsApp). No expone settings sensibles ni booleanos de estado de servicios (esos están en `/api/admin/status` protegido).

- [ ] **Step 1: Crear el archivo**

```typescript
// app/api/booking-settings/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('booking_settings')
    .select('key, value')
    .in('key', [
      'cancel_hours_before',
      'reschedule_hours_before',
      'advance_booking_days',
      'min_hours_advance',
      'whatsapp_phone',
      'business_name',
      'whatsapp_cancel_msg',
      'whatsapp_reschedule_msg',
    ])

  const m: Record<string, string> = {}
  for (const row of data ?? []) m[row.key] = row.value

  return NextResponse.json({
    settings: {
      cancel_hours_before:     parseInt(m.cancel_hours_before     ?? '3'),
      reschedule_hours_before: parseInt(m.reschedule_hours_before ?? '3'),
      advance_booking_days:    parseInt(m.advance_booking_days    ?? '90'),
      min_hours_advance:       parseInt(m.min_hours_advance       ?? '2'),
      whatsapp_phone:          m.whatsapp_phone          ?? '34600000000',
      business_name:           m.business_name           ?? 'BG Barber',
      whatsapp_cancel_msg:     m.whatsapp_cancel_msg     ?? 'Hola, necesito cancelar mi cita.',
      whatsapp_reschedule_msg: m.whatsapp_reschedule_msg ?? 'Hola, me gustaría cambiar mi cita.',
    },
  })
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/booking-settings/route.ts
git commit -m "feat: add public /api/booking-settings endpoint

Exposes client-relevant booking config (cancel/reschedule hours,
WhatsApp messages) without requiring auth. Used by /mis-citas page
to sync UI thresholds with admin-configured values."
```

---

## Task 6: Fix `MisCitasCard` — Aceptar y usar horas de configuración

**Archivos:**
- Modificar: `components/client/MisCitasCard.tsx`

> **Cascada obligatoria con Task 7:** Este componente ahora acepta nuevas props. Task 7 (mis-citas/page.tsx) debe pasarlas. Ambas tasks deben ser parte del mismo deploy.

- [ ] **Step 1: Añadir props `cancelHoursBefore` y `rescheduleHoursBefore`**

En la interface `MisCitasCardProps`, añadir las dos props opcionales (con default = 3 para mantener compatibilidad):

```typescript
interface MisCitasCardProps {
  appointment: Appointment
  variant?: 'featured' | 'compact'
  whatsappPhone?: string
  whatsappCancelMsg?: string
  whatsappRescheduleMsg?: string
  businessName?: string
  cancelHoursBefore?: number      // ← añadir
  rescheduleHoursBefore?: number  // ← añadir
  onRefresh: () => void
}
```

- [ ] **Step 2: Desestructurar las nuevas props con defaults**

En la función `MisCitasCard`, añadir las props desestructuradas:

```typescript
export default function MisCitasCard({
  appointment: initialAppointment,
  variant = 'compact',
  whatsappPhone = '34600000000',
  whatsappCancelMsg = 'Hola, necesito cancelar mi cita.',
  whatsappRescheduleMsg = 'Hola, me gustaría cambiar mi cita.',
  businessName = 'BG Barber',
  cancelHoursBefore = 3,       // ← añadir
  rescheduleHoursBefore = 3,   // ← añadir
  onRefresh,
}: MisCitasCardProps) {
```

- [ ] **Step 3: Usar las props en `canAct()`**

Reemplazar las dos líneas hardcodeadas:

```typescript
  // ANTES:
  const canCancel    = upcoming && canAct(appointment, 3)
  const canReschedule = upcoming && canAct(appointment, 3)

  // DESPUÉS:
  const canCancel     = upcoming && canAct(appointment, cancelHoursBefore)
  const canReschedule = upcoming && canAct(appointment, rescheduleHoursBefore)
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add components/client/MisCitasCard.tsx
git commit -m "fix: accept cancelHoursBefore/rescheduleHoursBefore props in MisCitasCard

Hardcoded 3h was disconnected from admin-configured booking_settings.
Props default to 3 for backwards compatibility."
```

---

## Task 7: Fix `mis-citas/page.tsx` — Pasar horas de settings a MisCitasCard

**Archivos:**
- Modificar: `app/mis-citas/page.tsx`

> La page ya fetchea `/api/booking-settings` (línea 60) y ya extrae `cancel_hours_before` y `reschedule_hours_before` en el estado `settings`. Solo falta pasarlos como props a `MisCitasCard`.

- [ ] **Step 1: Pasar `cancelHoursBefore` y `rescheduleHoursBefore` a la "Próxima cita" card**

Localizar el `<MisCitasCard` dentro de la sección "Próxima cita" (línea ~237) y añadir las dos props:

```tsx
            <MisCitasCard
              appointment={nextAppointment}
              variant="featured"
              whatsappPhone={settings.whatsapp_phone}
              whatsappCancelMsg={settings.whatsapp_cancel_msg}
              whatsappRescheduleMsg={settings.whatsapp_reschedule_msg}
              businessName={settings.business_name}
              cancelHoursBefore={settings.cancel_hours_before ?? 3}
              rescheduleHoursBefore={settings.reschedule_hours_before ?? 3}
              onRefresh={fetchAppointments}
            />
```

- [ ] **Step 2: Pasar las mismas props a las cards del historial**

Localizar el `<MisCitasCard` dentro del `.map()` del historial (línea ~260) y añadir las mismas props:

```tsx
                <MisCitasCard
                  key={appt.id}
                  appointment={appt}
                  variant="compact"
                  whatsappPhone={settings.whatsapp_phone}
                  whatsappCancelMsg={settings.whatsapp_cancel_msg}
                  whatsappRescheduleMsg={settings.whatsapp_reschedule_msg}
                  businessName={settings.business_name}
                  cancelHoursBefore={settings.cancel_hours_before ?? 3}
                  rescheduleHoursBefore={settings.reschedule_hours_before ?? 3}
                  onRefresh={fetchAppointments}
                />
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add app/mis-citas/page.tsx
git commit -m "fix: pass booking settings hours to MisCitasCard in mis-citas page

Previously MisCitasCard always used hardcoded 3h thresholds.
Now it receives the actual admin-configured values from booking_settings."
```

---

## Task 8: Build final + verificación + push

- [ ] **Step 1: Build completo**

```bash
npm run build
```

Resultado esperado: build sin errores. Las rutas que deben aparecer como `ƒ` (Dynamic):
- `/api/booking-settings` (nueva)
- `/api/cron/reminders` (existente, ahora sin Resend crash)
- `/mis-citas` (existente)

- [ ] **Step 2: Si hay errores de TypeScript en el build, identificar y corregir**

Errores comunes y sus causas:
- `'ALREADY_HAS_BOOKING' does not exist in type` → inofensivo, está en el union del return type de `bookAppointment` pero no se devuelve. No rompe.
- `Property 'cancelHoursBefore' does not exist on type 'MisCitasCardProps'` → Task 6 no se completó correctamente.
- `Cannot find module '@/lib/supabase/server'` en cron → Task 4 no eliminó bien el import.

- [ ] **Step 3: Push a main**

```bash
git push origin main
```

- [ ] **Step 4: Verificar en Vercel (2-3 min después del push)**

Ir a `https://vercel.com/dashboard` → confirmar que el build termina en estado READY.

- [ ] **Step 5: Smoke test en producción**

1. Abrir la app en prod → iniciar sesión
2. Ir a `/mis-citas` → buscar una cita futura confirmed con más de 3h de margen
3. Hacer clic en "Cancelar" → confirmar en el modal
4. Verificar: status cambia a "Cancelada" en `/mis-citas`
5. Verificar: en `/admin/agenda` la cita aparece cancelada (no confirmed)
6. Verificar: el slot queda libre (otro usuario puede reservarlo)

---

## Resumen de cascadas verificadas

| Fix | Efecto en otros archivos |
|---|---|
| Task 1 (RLS migration) | Desbloquea Task 2 — sin la migration el check de Task 2 sigue fallando aunque el código esté correcto |
| Task 2 (update check) | Requiere que Task 3 añada `UPDATE_FAILED` a los modales — sin Task 3, el error llega al catch genérico y muestra "Error inesperado" |
| Task 4 (cron) | Elimina import de `createClient` — debe eliminarse el import o TS/build se queja de import unused (warning, no error, pero limpio) |
| Task 5 (API route) | Task 7 depende de ella — si el endpoint no existe, Task 7 sigue usando defaults (funcionalmente OK pero no el fix completo) |
| Task 6 (MisCitasCard props) | Task 7 debe pasar las nuevas props — si Task 7 no se hace, las cards ignorarán las settings igualmente (solo usarán el default de 3 de las props) |
| Task 7 (page props) | Depende de Task 5 (endpoint) y Task 6 (props interface) — todos deben estar en el mismo deploy |

## Lo que NO cambia (verificado seguro)

- `rescheduleAppointment` (cliente) sigue funcionando — status no cambia, RLS passes
- `adminCancelAppointment`, `adminMarkNoShow`, `adminMarkCompleted`, `adminRescheduleAppointment` — todos usan admin auth, `is_admin()=true` bypasea el check de status en WITH CHECK
- `bookAppointment` — INSERT policy no afectada por esta migration
- Walk-ins admin — `appointments_insert_admin` policy no tocada
- `/admin/agenda`, métricas, servicios — no afectados
