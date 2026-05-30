# Decision Record
<!-- Updated by forge:sync — do not edit manually -->

[2026-05-29] Next.js 15 App Router + Supabase chosen as stack — Reason: Vercel-native, minimal config, Supabase handles auth+db+storage in one service with generous free tier. Fastest path to ship.

[2026-05-29] Admin identified by ADMIN_EMAIL env var + RLS helper function — Reason: Single admin (Rodrigo), no need for admin_users table or role system. Simplest secure approach.

[2026-05-29] Phone OTP + Google OAuth for clients (not just Google) — Reason: User explicitly wanted phone verification. Phone number is harder to fake than email, deters no-show abuse. Supabase supports both natively.

[2026-05-29] Per-date availability slots (not recurring weekly schedule) — Reason: Rodrigo works flexible days (mainly Thu/Fri but wants to add any day). A recurring template would need override logic. Per-date slots are more explicit and flexible. Admin creates slots for each specific date he wants to work.

[2026-05-29] Bulk slot generator in admin (from_time to to_time every 30min) — Reason: Creating 30-minute slots one by one for a full day would be tedious. Bulk generator makes it practical.

[2026-05-29] 1 active booking per user rate limit — Reason: Anti-spam. Prevents one person from blocking all slots. Client can only have 1 confirmed future appointment at a time.

[2026-05-29] Supabase Storage for gallery images — Reason: Integrated with Supabase, RLS-protected uploads, public read URLs. No additional service needed.

[2026-05-29] design-taste-frontend + high-end-visual-design skills for public landing — Reason: User wants "premium/luxury feel". These skills specifically prevent LLM design slop and enforce agency-tier output quality.

[2026-05-29] Admin panel uses shadcn/ui (functional, not taste-skill aesthetic) — Reason: Admin panel is a utility tool for Rodrigo only. Premium aesthetic adds complexity without value here. shadcn/ui gives solid, accessible, professional admin UI fast.
