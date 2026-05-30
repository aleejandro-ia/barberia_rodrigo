# Project Brief
Generated: 2026-05-29
Mode: GREENFIELD

## What the user wants
Mini landing page premium para la barbería de Rodrigo. Objetivo: agendar citas online. Landing con hero inspirado en Instagram del barbero (foto perfil + lema), sección "sobre mí", galería de cortes con plantilla uniforme, sección de reservas con calendario. Panel de administrador para que Rodrigo gestione fotos de la galería, defina qué días y horas abre, y vea/gestione las citas. Clientes autenticados via teléfono (OTP) o Google para evitar reservas fantasma. Botón flotante de WhatsApp para contacto directo.

## Problem & users
When [a client wants a haircut], [barbershop customers] want [to book a slot online without calling] so they can [secure their appointment and avoid waiting].
Specific users: (1) Clients - book appointments, need phone/Google auth; (2) Rodrigo (admin) - manage gallery, set weekly availability, view/cancel appointments.
Why now: friend asked for it, has no online booking system currently.

## Appetite
Team: solo developer (Alejandro building for friend Rodrigo)
Time investment: days to 1 week
Hard constraints: free/low-cost infra, phone OTP must work, single admin user

## Solution — v1 scope
Type: web app (Next.js public landing + admin panel)
Core features (max 3):
1. Premium public landing page: hero, about, gallery, booking with calendar
2. Client auth via phone OTP or Google OAuth (anti no-show verification)
3. Admin panel: gallery management, weekly schedule config, appointments dashboard
Explicit no-gos: no payments, no multi-barber, no mobile app, no email campaigns

## Technical decisions
Stack: Next.js 15 (App Router) + TypeScript + Tailwind v4 + Motion
Database: Supabase (PostgreSQL) - free tier, RLS, Storage for gallery, built-in Auth
Auth: Supabase Auth - phone OTP + Google OAuth for clients; admin identified by ADMIN_EMAIL env var checked in middleware
Deploy: Vercel - free tier, zero config for Next.js
AI: not applicable
External integrations: WhatsApp via wa.me link (no API), Supabase Storage (gallery images), Google OAuth via Supabase

## Business model
Free - personal gift project. No monetization.

## Technical recommendations
- Phone OTP uses Supabase/Twilio free tier (~50 SMS/month). Sufficient for a local barbershop.
- Admin: middleware checks session email against ADMIN_EMAIL env var. No separate admin table needed.
- Anti-spam: phone OTP forces real phone. Rate limit: 1 active booking per user at a time.
- WhatsApp: floating button with wa.me/[number] link. Zero API cost.
- Gallery: Supabase Storage public bucket, URLs stored in gallery_images table.
- Design: public landing uses high-end-visual-design + design-taste-frontend skills for premium feel. Admin panel uses shadcn/ui functional components.

## Flags & warnings
- Supabase free phone SMS limit (~50/month). Acceptable for v1 local barbershop volume.
- Google OAuth needs Google Cloud Console OAuth app setup (simple but manual step for user).
- Admin panel is intentionally functional/utility - taste skills only apply to public landing.

## Complexity estimate
Size: Small-Medium
Estimated time range: 1 week
Main complexity drivers: Supabase Auth phone OTP config, weekly availability grid in admin, RLS correctness
