# Project Plan
Generated: 2026-05-29
Project: Barbería Rodrigo — Premium Booking Web App
Structure: Option A — Modular monolith (Next.js App Router, single Vercel deployment)

## Phase Overview
| Phase | Name | Depends on | Parallel [P] | Subagent |
|-------|------|------------|--------------|---------|
| 0 | Setup & base | — | — | subagent-setup |
| 1 | Database & schema | 0 | — | subagent-db |
| 2 | Authentication | 0, 1 | — | subagent-auth |
| 3 | API layer | 1, 2 | — | subagent-api |
| 4 | Public landing UI | 3 | [P] with 5 | subagent-landing |
| 5 | Admin panel UI | 3 | [P] with 4 | subagent-admin |
| 6 | Deploy & final | 4, 5 | — | subagent-deploy |

## Detailed Phases

### Phase 0 — Setup & base
**Subagent:** subagent-setup
**Depends on:** nothing
**Parallel:** no
**Acceptance criteria:**
- [ ] Next.js 15 project created with TypeScript and App Router at project root
- [ ] Tailwind v4 configured and working (use @tailwindcss/postcss plugin)
- [ ] shadcn/ui initialized (for admin panel components)
- [ ] Motion library installed (motion/react)
- [ ] Supabase JS client installed (@supabase/supabase-js, @supabase/ssr)
- [ ] .env.local.example created with all required env vars documented
- [ ] Basic folder structure: app/, components/, lib/, types/, actions/
- [ ] next.config.ts configured (images: supabase domain allowed)
- [ ] package.json has all required dependencies
- [ ] `npm run dev` starts without errors
**Estimated time:** 2-3 hours
**Files owned by this subagent:**
- package.json
- next.config.ts
- tailwind.config.ts (or global.css if v4)
- postcss.config.js
- tsconfig.json
- .env.local.example
- app/layout.tsx (root layout only, minimal)
- app/globals.css
- lib/supabase/client.ts
- lib/supabase/server.ts
- lib/supabase/middleware.ts
- middleware.ts
- components/ui/ (shadcn init output)
- types/index.ts (shared TypeScript types from CONTRACTS.md)

### Phase 1 — Database & schema
**Subagent:** subagent-db
**Depends on:** Phase 0
**Parallel:** no
**Acceptance criteria:**
- [ ] SQL migration file created with all tables: profiles, gallery_images, availability_slots, appointments
- [ ] All foreign keys, unique constraints, and indexes defined per DATA_MODEL.md
- [ ] RLS enabled on all tables with correct policies (public read for gallery/slots, user-owned for appointments)
- [ ] is_admin() helper function defined
- [ ] Trigger to auto-create profiles row on auth.users insert
- [ ] Supabase Storage bucket `gallery` created with correct permissions (public read, admin write)
- [ ] Migration file is valid SQL that can be run in Supabase SQL editor
- [ ] supabase/migrations/001_initial_schema.sql created and documented
**Estimated time:** 3-4 hours
**Files owned by this subagent:**
- supabase/migrations/001_initial_schema.sql
- supabase/seed.sql (optional: example availability slots for testing)

### Phase 2 — Authentication
**Subagent:** subagent-auth
**Depends on:** Phase 0, Phase 1
**Parallel:** no
**Acceptance criteria:**
- [ ] Supabase Auth configured for phone OTP + Google OAuth (code-side, .env documented)
- [ ] Auth middleware protects /admin/* routes (redirects non-admin to /)
- [ ] Auth middleware protects /api/admin/* routes (returns 401 for non-admin)
- [ ] Auth callback route handler at /auth/callback
- [ ] Phone OTP sign-in flow: send OTP, verify OTP, session created
- [ ] Google OAuth sign-in flow: redirect, callback, session created
- [ ] Sign-out route/action
- [ ] useUser hook or server utility to get current user
- [ ] Admin check utility: isAdmin(session) checks email vs ADMIN_EMAIL env var
- [ ] Profile auto-creation trigger tested (profile row created on first sign-in)
**Estimated time:** 4-6 hours
**Files owned by this subagent:**
- app/auth/callback/route.ts
- app/auth/sign-out/route.ts
- middleware.ts (UPDATE: add admin protection to existing file)
- lib/auth.ts (isAdmin, getUser utilities)
- components/auth/PhoneOtpForm.tsx
- components/auth/GoogleSignInButton.tsx
- components/auth/AuthModal.tsx (modal wrapping both methods)

### Phase 3 — API layer
**Subagent:** subagent-api
**Depends on:** Phase 1, Phase 2
**Parallel:** no
**Acceptance criteria:**
- [ ] All route handlers from CONTRACTS.md implemented and returning correct types
- [ ] All server actions from CONTRACTS.md implemented with proper validation
- [ ] bookAppointment: validates slot availability, 1-active-booking limit, creates appointment
- [ ] cancelAppointment: validates ownership, updates status
- [ ] createAvailabilitySlots + bulkCreateSlots: admin only, creates slots
- [ ] deleteAvailabilitySlot: validates no confirmed booking exists, admin only
- [ ] Gallery API: upload (Supabase Storage + DB insert), delete (Storage + DB), reorder
- [ ] All endpoints return correct error codes from CONTRACTS.md
- [ ] Zod validation on all inputs
**Estimated time:** 6-8 hours
**Files owned by this subagent:**
- app/api/gallery/route.ts
- app/api/availability/dates/route.ts
- app/api/availability/slots/route.ts
- app/api/appointments/mine/route.ts
- app/api/admin/appointments/route.ts
- app/api/admin/gallery/route.ts
- actions/appointments.ts
- actions/availability.ts
- actions/gallery.ts
- lib/validations.ts (Zod schemas)

### Phase 4 — Public landing UI
**Subagent:** subagent-landing
**Depends on:** Phase 3
**Parallel:** [P] with Phase 5
**Acceptance criteria:**
- [ ] Floating glass-pill navbar (Rodrigo Barbería logo/name, scroll-aware, mobile hamburger)
- [ ] Hero section: full-bleed dark aesthetic, barbershop name + tagline inspired by Instagram, photo/image of barber, CTA "Reservar cita" button
- [ ] About section: brief text about Rodrigo, professional photo placeholder
- [ ] Gallery section: responsive masonry/grid of haircut photos from DB, all same aspect ratio template, uses real Supabase data
- [ ] Booking section: calendar showing available dates, time slot selector, auth gate (shows AuthModal if not logged in), booking form (name, phone, notes), confirmation state
- [ ] Floating WhatsApp button (bottom-right, branded green, wa.me link)
- [ ] Page is fully responsive (mobile-first)
- [ ] Scroll animations on section entry (Motion whileInView)
- [ ] Dark theme throughout (consistent, no section flips)
- [ ] All design taste skills applied: no Inter, no generic layouts, no AI tells
- [ ] Booking flow: select date → select slot → fill form → submit → confirmation
- [ ] Loading/error/empty states for gallery and calendar
**Estimated time:** 8-12 hours
**Files owned by this subagent:**
- app/page.tsx
- app/loading.tsx
- components/landing/HeroSection.tsx
- components/landing/NavBar.tsx
- components/landing/AboutSection.tsx
- components/landing/GallerySection.tsx
- components/landing/BookingSection.tsx
- components/landing/WhatsAppButton.tsx
- components/landing/BookingCalendar.tsx
- components/landing/TimeSlotPicker.tsx
- components/landing/BookingForm.tsx
- components/landing/BookingConfirmation.tsx
**Skills to request:** design-taste-frontend, high-end-visual-design

### Phase 5 — Admin panel UI
**Subagent:** subagent-admin
**Depends on:** Phase 3
**Parallel:** [P] with Phase 4
**Acceptance criteria:**
- [ ] /admin route protected by middleware (redirect to / if not admin)
- [ ] Admin dashboard: upcoming appointments list (by date), cancel appointment button
- [ ] Gallery management: image grid, upload new image (drag-and-drop), delete image, drag-to-reorder
- [ ] Schedule management: date picker to select a day, bulk slot generator (from/to/duration), see existing slots, delete individual slot (with booking conflict check)
- [ ] Admin nav (simple sidebar or top nav): Citas / Galería / Horarios
- [ ] Responsive on tablet (admin will likely use phone or tablet)
- [ ] All shadcn/ui components used (no taste-skill premium aesthetics needed here)
- [ ] Confirmation dialogs before destructive actions (delete image, cancel appointment)
- [ ] Real-time or auto-refresh appointments list
**Estimated time:** 8-12 hours
**Files owned by this subagent:**
- app/admin/layout.tsx
- app/admin/page.tsx (dashboard / appointments)
- app/admin/gallery/page.tsx
- app/admin/schedule/page.tsx
- components/admin/AppointmentsList.tsx
- components/admin/GalleryManager.tsx
- components/admin/ScheduleManager.tsx
- components/admin/SlotBulkCreator.tsx
- components/admin/AdminNav.tsx

### Phase 6 — Deploy & final config
**Subagent:** subagent-deploy
**Depends on:** Phase 4, Phase 5
**Parallel:** no
**Acceptance criteria:**
- [ ] vercel.json configured if needed (or confirm zero-config works)
- [ ] README.md with setup instructions (Supabase project setup, env vars, Google OAuth steps, how to run SQL migration)
- [ ] All env vars documented in README and .env.local.example
- [ ] next.config.ts has correct image domains for Supabase storage
- [ ] Build passes: `npm run build` exits 0 with no type errors
- [ ] No hardcoded secrets anywhere in code
- [ ] .gitignore includes .env.local
**Estimated time:** 2-3 hours
**Files owned by this subagent:**
- README.md
- .gitignore
- vercel.json (if needed)
- .env.local.example (UPDATE: ensure all vars present)

## Total estimate
Size: Small-Medium
Total time range: 2-4 days of focused development
Main risk: Supabase Auth phone OTP configuration (Twilio integration requires Supabase project setup), Google OAuth credentials setup
