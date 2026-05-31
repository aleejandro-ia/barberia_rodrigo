---
name: admin-mobile-nav
description: Mobile bottom tab bar for Next.js admin panel — iOS safe-area, z-index, active state, no content occlusion.
---

<instructions>

# Admin Mobile Nav — Bottom Tab Bar

## Purpose
Implement a responsive admin nav: sticky top nav on desktop, bottom tab bar on mobile. iOS safe-area critical. Must not cover page content.

## This skill activates when
Building or modifying AdminNav.tsx for the BG Barber admin panel.

## Core knowledge

### Bottom Tab Bar Structure
```tsx
// Fixed bottom, full width, above everything
<nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
  {/* min height 60px BEFORE safe-area padding */}
  <div className="flex h-[60px] ...">
    {navItems.map(...)}
  </div>
</nav>
```

### iOS Safe Area — CRITICAL
- Use `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` directly on the nav
- Do NOT use Tailwind's `pb-safe` — not available in Tailwind v4 without custom config
- The `env(safe-area-inset-bottom)` adds extra space below the tabs on notched iPhones
- Container height = 60px (base) + safe-area padding

### Content Padding (prevent occlusion)
```tsx
// app/admin/layout.tsx — main content area
<main className="pb-20 md:pb-0"> {/* 80px clearance on mobile */}
  {children}
</main>
```
Without `pb-20 md:pb-0`, bottom content is permanently hidden under the nav.

### Tap Target Size
- Each tab button: minimum `w-full h-full` within the 60px bar
- Icon: 20-22px, label: text-xs (10-11px)
- Padding inside button: `py-2` minimum

### Active State
```tsx
const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
// Special case: /admin exact match only (not /admin/*)
// /admin/services: active when pathname starts with /admin/services
```

### Z-index Stack
- Bottom tab bar: z-50
- Any modal/dialog: z-[100] or higher
- Never let a modal go below z-50 or it hides behind the tab bar

### Desktop Nav
- `hidden md:flex` — horizontal row
- Sticky: `sticky top-0 z-40`
- Background: `rgba(14,11,8,0.92)` with `backdrop-blur-sm`
- Gold accent on active: `#C9A96E`

### The 5 Nav Items (exact routes)
```
Agenda      → /admin          (CalendarDots icon)
Servicios   → /admin/services (Scissors icon)
Media       → /admin/media    (Images icon)
Horarios    → /admin/schedule (Clock icon)
Ajustes     → /admin/ajustes  (Gear icon)
```

### Anti-patterns to prevent
- ❌ `pb-[calc(env(safe-area-inset-bottom)+60px)]` on nav — adds height unpredictably; use padding-bottom env() instead
- ❌ Hamburger menu on mobile — user explicitly wants bottom tab bar
- ❌ `h-screen` for main content wrapper — clips content above safe area
- ❌ Missing `md:pb-0` — desktop gets unnecessary bottom padding
- ❌ `overflow-hidden` on layout body — clips the fixed bottom bar in some Safari versions

### Redirect files (dead simple)
```tsx
// app/admin/settings/page.tsx — full file
import { redirect } from 'next/navigation'
export default function Page() { redirect('/admin/ajustes') }

// app/admin/gallery/page.tsx
import { redirect } from 'next/navigation'
export default function Page() { redirect('/admin/media') }
```

## Acceptance criteria
- Desktop (md+): top sticky nav with 5 links, gold active state
- Mobile (<md): top bar (logo + title + sign out) + bottom tab bar fixed
- Bottom bar: min 60px, iOS safe-area padding, all 5 tabs visible
- Content not hidden behind bottom bar (pb-20 md:pb-0 on main)
- Tap targets min 44px (60px bar + full-width buttons)
- Active state correct for all 5 routes
- npx tsc --noEmit passes

## What this skill must never do
- Suggest hamburger menu on mobile
- Suggest React state for nav open/close (no drawer, no toggle)
- Add npm packages for this (native CSS + Tailwind only)

</instructions>
