---
name: horarios-backend-context
description: BLOCKING — Project-specific backend patterns for BG Barber Horarios: booking_settings key-value store, supabaseAdmin usage, ON CONFLICT slot generation.
---

<instructions>

# Horarios Backend Context — BG Barber

## Purpose
Prevent critical backend mistakes in actions/scheduleTemplate.ts and api/admin/schedule-template/route.ts. Wrong Supabase client choice → silent RLS failures. Wrong conflict handling → slot duplicates.

## This skill activates when
Creating actions/scheduleTemplate.ts or app/api/admin/schedule-template/route.ts.

## Core knowledge

### Supabase Client Choice — CRITICAL
```typescript
// FOR SERVER ACTIONS (actions/scheduleTemplate.ts):
import { createClient } from '@/lib/supabase/server'
// Reason: server actions run in request context with user cookies → RLS applies
// isAdmin() check must pass before any write

// FOR API ROUTES (app/api/admin/schedule-template/route.ts):
import { createClient } from '@/lib/supabase/server'
// Same — request context available in API routes
// NOT supabaseAdmin unless explicitly bypassing RLS

// NEVER use supabaseAdmin for user-triggered mutations
// supabaseAdmin = lib/supabase/admin.ts = service_role key = bypasses ALL RLS
// Only use supabaseAdmin for: cron jobs, background ops without user session
```

### booking_settings Key-Value Store Pattern
```typescript
// booking_settings table: { key: string, value: string }
// schedule_template is stored as JSON string under key 'schedule_template'

// READ template:
const { data } = await supabase
  .from('booking_settings')
  .select('value')
  .eq('key', 'schedule_template')
  .single()
const template = data?.value ? JSON.parse(data.value) : []

// WRITE template (upsert — no migration needed):
await supabase
  .from('booking_settings')
  .upsert({ key: 'schedule_template', value: JSON.stringify(template) })
  .eq('key', 'schedule_template')  // for safety, though upsert uses key as PK
```

### Admin Check Pattern
```typescript
import { isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function saveScheduleTemplate(template: ScheduleEntry[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'UNAUTHORIZED' }
  // ... proceed
}
```

### Template Type
```typescript
interface ScheduleEntry {
  day: number        // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string // 'HH:MM' format
  end_time: string   // 'HH:MM' format
}
```

### Slot Generation — ON CONFLICT DO NOTHING (CRITICAL)
```typescript
// availability_slots table: { date, start_time, end_time, is_available }
// MUST use ON CONFLICT to avoid duplicates

// Generate 30-min slots from startTime to endTime for a given date:
function generateSlots(date: string, start: string, end: string) {
  const slots = []
  let current = start
  while (current < end) {
    const [h, m] = current.split(':').map(Number)
    const next = `${String(h + (m === 30 ? 1 : 0)).padStart(2,'0')}:${m === 30 ? '00' : '30'}`
    if (next > end) break
    slots.push({ date, start_time: current, end_time: next, is_available: true })
    current = next
  }
  return slots
}

// Insert with conflict skip:
const { data, error } = await supabase
  .from('availability_slots')
  .upsert(slots, { onConflict: 'date,start_time', ignoreDuplicates: true })
  .select()
// ignoreDuplicates: true → ON CONFLICT DO NOTHING equivalent in Supabase client
// Count created: data?.length ?? 0
// Count skipped: slots.length - (data?.length ?? 0)
```

### Date Range Generation
```typescript
// For generateSlotsFromTemplate(startDate: string, weeks: number):
import { addDays, parseISO, format, getDay } from 'date-fns'

const start = parseISO(startDate)
const total = weeks * 7
let created = 0, skipped = 0

for (let i = 0; i < total; i++) {
  const date = addDays(start, i)
  const dayOfWeek = getDay(date) // 0=Sun, 6=Sat — matches template.day
  const dateStr = format(date, 'yyyy-MM-dd')
  
  const match = template.find(t => t.day === dayOfWeek)
  if (!match) continue
  
  const slots = generateSlots(dateStr, match.start_time, match.end_time)
  // insert with upsert ignoreDuplicates...
  created += inserted
  skipped += slots.length - inserted
}
return { created, skipped }
```

### Validation Rules
```typescript
// saveScheduleTemplate validation:
for (const entry of template) {
  if (entry.day < 0 || entry.day > 6) return { error: 'VALIDATION_ERROR' }
  if (!/^\d{2}:\d{2}$/.test(entry.start_time)) return { error: 'VALIDATION_ERROR' }
  if (!/^\d{2}:\d{2}$/.test(entry.end_time)) return { error: 'VALIDATION_ERROR' }
  if (entry.start_time >= entry.end_time) return { error: 'VALIDATION_ERROR' }
}

// generateSlotsFromTemplate validation:
if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { error: 'VALIDATION_ERROR' }
if (!weeks || weeks < 1 || weeks > 52) return { error: 'VALIDATION_ERROR' }
// Check template exists:
if (!template || template.length === 0) return { error: 'NO_TEMPLATE' }
```

### API Route Pattern
```typescript
// app/api/admin/schedule-template/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // fetch from booking_settings...
  return NextResponse.json({ template })
}
```

### revalidatePath
```typescript
import { revalidatePath } from 'next/cache'
// After any mutation:
revalidatePath('/admin/schedule')
revalidatePath('/admin')
```

### Anti-patterns to prevent
- ❌ Using `supabaseAdmin` (service_role) in server actions triggered by user
- ❌ Storing template in a new DB table (no migration allowed — use booking_settings)
- ❌ `insert` without `upsert ignoreDuplicates` → duplicate slot errors on re-generation
- ❌ Missing isAdmin() check → any authenticated user could overwrite the schedule
- ❌ `getDay()` = 0 for Sunday (note: consistent with template.day convention)
- ❌ Slot time math with plain string arithmetic ("08:30" + 30) → use proper increment

## Acceptance criteria
- saveScheduleTemplate: validates, writes to booking_settings, revalidates
- generateSlotsFromTemplate: reads template, generates 30-min slots, ON CONFLICT ignored
- Returns { created, skipped } counts accurately
- GET /api/admin/schedule-template: admin-only, returns [] if no template
- No new DB migration needed
- npx tsc --noEmit passes

## What this skill must never do
- Create a new database table for schedule template
- Use supabaseAdmin for user-triggered mutations
- Skip the isAdmin() check on any mutation
- Use INSERT without conflict handling

</instructions>
