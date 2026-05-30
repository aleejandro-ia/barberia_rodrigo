# Skill Selection
Generated: 2026-05-29

## Always-on skills (active every session)
- caveman — token optimization, terse communication
- napkin — per-project mistake memory
- forge:sync — live context updater

## Phase skill assignments

### Phase 0 — Setup & base
Skills: none needed
Reason: Boilerplate scaffold with clear spec. Any competent agent handles this without a skill.

### Phase 1 — Database & schema
Skills: none custom needed
Reason: DATA_MODEL.md fully specifies the schema. Supabase RLS patterns are standard.
Note: Agent should be aware of Supabase RLS best practices (documented in DATA_MODEL.md).

### Phase 2 — Authentication
Skills: none custom needed
Reason: Supabase Auth with phone OTP + Google OAuth is well-documented. CONTRACTS.md covers all auth flows.

### Phase 3 — API layer
Skills: none custom needed
Reason: CONTRACTS.md fully specifies all endpoints and server actions. Zod validation is standard.

### Phase 4 — Public landing UI
Skills: design-taste-frontend — BLOCKING, high-end-visual-design — BLOCKING
Reason: User explicitly wants a premium/luxury feel. These skills prevent AI design slop (generic layouts, Inter font, AI-purple gradients, etc.) and enforce agency-tier output. Without them, the landing will look like a template.
Skill paths:
- .agents/skills/design-taste-frontend/SKILL.md
- .agents/skills/high-end-visual-design/SKILL.md

### Phase 5 — Admin panel UI
Skills: none (intentionally)
Reason: Admin panel is a utility tool. Premium aesthetics add complexity without value. shadcn/ui provides solid, professional, accessible components.

### Phase 6 — Deploy & final config
Skills: none needed
Reason: Simple documentation and config task.

## Detected gaps
- No skill exists in SKILL_REPO.md (it was empty — first project). Built from installed taste-skills instead.
- No Supabase-specific skill installed. DATA_MODEL.md and CONTRACTS.md compensate with explicit schema and patterns.

## Skills created this session
None — using installed taste-skills directly (design-taste-frontend, high-end-visual-design from Leonxlnx/taste-skill).

## Skills added to SKILL_REPO.md after this project
After execution, evaluate and add to SKILL_REPO.md:
- design-taste-frontend (Leonxlnx/taste-skill) — for premium landing pages
- high-end-visual-design (Leonxlnx/taste-skill) — for agency-tier UI components
