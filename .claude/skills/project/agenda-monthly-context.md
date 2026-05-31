---
name: agenda-monthly-context
description: Project-specific context for building the monthly agenda grid in BG Barber admin — types, date-fns patterns, existing component reuse.
---

<instructions>

# Agenda Monthly Context — BG Barber

## Purpose
Provide project-specific knowledge for rewriting app/admin/page.tsx as a monthly calendar grid while reusing existing AgendaSlotRow, AgendaModal, AgendaDayPanel components unchanged.

## This skill activates when
Building MonthlyCalendarGrid.tsx, MonthCalNav.tsx, or rewriting app/admin/page.tsx.

## Core knowledge

### Existing Types (types/index.ts) — DO NOT redefine
```typescript
interface AgendaSlot {
  slot: AvailabilitySlot
  appointment: Appointment | null
}
interface AgendaDay {
  date: string          // 'YYYY-MM-DD'
  slots: AgendaSlot[]
  totalSlots: number
  confirmedCount: number
  blockedCount: number
  freeCount: number
}
```
These already exist in `types/index.ts`. Import them, never redefine.

### API: GET /api/admin/agenda?from=YYYY-MM-DD&to=YYYY-MM-DD
- Returns `{ days: AgendaDay[] }`
- This route is being MODIFIED in P16-D to accept up to 31 days (was 14)
- For monthly view: `from` = first day of month, `to` = last day of month
- Validate range ≤ 31 days server-side

### Date-fns Patterns (already installed)
```typescript
import { startOfMonth, endOfMonth, eachDayOfInterval, 
         startOfWeek, endOfWeek, format, parseISO, 
         isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

// Month grid: includes partial weeks at start/end
const monthStart = startOfMonth(currentMonth)
const monthEnd = endOfMonth(currentMonth)
const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })
// allDays may include days from prev/next month — show them greyed out
```

### Monthly Grid Layout
```tsx
// 7 columns, variable rows (5-6 depending on month)
<div className="grid grid-cols-7 gap-1">
  {/* Day headers */}
  {['L','M','X','J','V','S','D'].map(d => (
    <div key={d} className="text-center text-xs text-[#7A7268] py-2">{d}</div>
  ))}
  {/* Day cells */}
  {allDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const agendaDay = days.find(d => d.date === dateStr)
    const isCurrentMonth = isSameMonth(day, currentMonth)
    // ...
  })}
</div>
```

### Day Cell Min Size (mobile tap target)
```tsx
<button
  className="min-h-[44px] min-w-[44px] ..." // CRITICAL for mobile
  onClick={() => onSelectDate(dateStr)}
  disabled={!isCurrentMonth}
>
```

### Components to REUSE (never recreate)
```typescript
// These exist at:
import AgendaDayPanel from '@/components/admin/agenda/AgendaDayPanel'
import AgendaModal from '@/components/admin/agenda/AgendaModal'
import { AgendaModalMode } from '@/components/admin/agenda/AgendaModal' // or types/index.ts
```
- AgendaDayPanel receives: `day: AgendaDay | null, onOpenModal: (mode: AgendaModalMode) => void`
- AgendaModal receives: `mode: AgendaModalMode, onClose: () => void, onRefresh: () => void`
- Do NOT recreate these. Import them.

### Layout: Desktop 2-col / Mobile Stack
```tsx
// Desktop: grid with sticky right panel
<div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
  <div>
    {/* MonthCalNav + MonthlyCalendarGrid */}
  </div>
  <div className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
    {/* AgendaDayPanel */}
  </div>
</div>
// Mobile: calendar full width, panel below when date selected
<div className="lg:hidden mt-4">
  {selectedDate && <AgendaDayPanel ... />}
</div>
```

### Data Fetch Pattern
```typescript
// app/admin/page.tsx — fetch month data
const fetchMonth = async (month: Date) => {
  const from = format(startOfMonth(month), 'yyyy-MM-dd')
  const to = format(endOfMonth(month), 'yyyy-MM-dd')
  const res = await fetch(`/api/admin/agenda?from=${from}&to=${to}`)
  const data = await res.json()
  setDays(data.days ?? [])
}
```

### Day Cell Visual States
```
Normal day (no slots): number in #7A7268
Day with citas: number + gold dot below + count
Selected day: gold border or bg tint
Today: subtle underline or circle
Prev/next month days: opacity-30, not clickable
```

### Anti-patterns to prevent
- ❌ Reinventing AgendaSlotRow or AgendaModal from scratch
- ❌ Using `new Date()` for date math without date-fns (timezone bugs)
- ❌ Hardcoding ['Mon','Tue',...] in English — this is a Spanish app (L,M,X,J,V,S,D)
- ❌ weekStartsOn: 0 (Sunday) — Spain starts Monday, use weekStartsOn: 1
- ❌ Cell width fixed px — must be fluid 1/7 of container
- ❌ api/admin/agenda GET without updating the 14→31 day limit

## Acceptance criteria
- MonthlyCalendarGrid: 7-col grid, variable rows, all days of month visible
- Day cells: min 44×44px, confirms on mobile no horizontal overflow
- Reuses AgendaDayPanel, AgendaModal, AgendaSlotRow unchanged
- API route accepts up to 31-day range
- Desktop 2-col layout, mobile stack
- All existing CRUD operations (create/edit/cancel/block) still work
- npx tsc --noEmit passes

## What this skill must never do
- Recreate AgendaDayPanel or AgendaModal
- Import date-fns without { weekStartsOn: 1 } for week calculations
- Use English day names (L M X J V S D in Spanish)
- Create a new API endpoint instead of using existing /api/admin/agenda

</instructions>
