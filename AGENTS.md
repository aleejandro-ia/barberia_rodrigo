# Barbería Rodrigo — Agent Context
# Last updated: 2026-05-29
# READ THIS ENTIRE FILE before doing anything in this project.

## What is this project
Premium barbershop booking web app for barber Rodrigo. Clients book haircut appointments online via a dark-themed luxury landing page, verified with phone OTP or Google auth. Rodrigo manages gallery photos, weekly schedule, and appointments via an admin panel. Stack: Next.js 16 + Supabase + Tailwind v4 + Vercel.

## Current State
Phase 6 of 6 — COMPLETE. All code built and build passes. Awaiting user setup (Supabase project + env vars) before local testing and deploy.

## EXACT NEXT STEP
User needs to set up Supabase project and configure env vars. See README.md for complete instructions. No code changes needed — project is build-ready.

## Tech Stack
- Framework: Next.js 16 (App Router, TypeScript)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (phone OTP + Google OAuth)
- Storage: Supabase Storage (gallery bucket, public)
- Styling: Tailwind v4 + shadcn/ui (base-nova)
- Animation: Motion (motion/react)
- Deploy: Vercel
- Icons: @phosphor-icons/react

## Important Files
proxy.ts — middleware (Next.js 16 convention, NOT middleware.ts)
lib/supabase/client.ts — browser Supabase client
lib/supabase/server.ts — server Supabase client
lib/auth.ts — getUser() + isAdmin() utilities
actions/appointments.ts — booking server actions
actions/availability.ts — schedule server actions
actions/gallery.ts — gallery server actions
supabase/migrations/001_initial_schema.sql — run this in Supabase SQL editor first
.env.local.example — copy to .env.local and fill values
README.md — full setup guide

## API Contracts
See .forge/CONTRACTS.md — do not deviate from these contracts

## Do NOT touch
proxy.ts — Next.js 16 uses proxy.ts NOT middleware.ts (do not create a middleware.ts)
supabase/migrations/ — run via Supabase SQL editor, do not modify unless adding a new migration

## FORGE Documents
- .forge/PROJECT_BRIEF.md — requirements and technical decisions
- .forge/PLAN.md — full phase plan
- .forge/CONTRACTS.md — API contracts between front and back
- .forge/DATA_MODEL.md — database schema
- .forge/SKILL_SELECTION.md — skills assigned per phase
- .forge/DECISIONS.md — decision record
- .forge/PROGRESS.md — live project state (most important)
