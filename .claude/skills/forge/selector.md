---
name: forge:selector
description: Analyze the approved project plan and build custom skills for each phase by reading SKILL_REPO.md, combining the best ideas, and presenting proposals for user approval before creating anything.
---

<instructions>

# forge:selector — Skill Profiler & Builder

This is a RIGID skill. Follow every step exactly.

## Prerequisites

Before starting, verify:
- `.forge/PLAN.md` exists and has been approved by the user
- `.forge/PROJECT_BRIEF.md` exists
- `SKILL_REPO.md` exists (may be partially empty — that is OK)

Read all three completely before doing anything else.

---

## STEP 1 — Analyze the plan

Read `.forge/PLAN.md` and identify for each phase:
- What technical domain does it cover?
- What specific knowledge would make a subagent significantly better at this task?
- What are the failure modes if the subagent lacks that knowledge?

NOT every phase needs a custom skill. Apply this filter:

**A phase needs a skill if:**
- It involves a specific technology with non-obvious best practices (Supabase RLS, Clerk setup, Prisma migrations)
- It involves architectural decisions that could go wrong without guidance (DB schema design, API structure)
- It involves security-sensitive work (auth, payments, API exposure)
- The subagent working generically would produce mediocre or risky output

**A phase does NOT need a skill if:**
- It is pure boilerplate with no real decisions (basic folder setup, .gitignore)
- The task is simple enough that any competent agent handles it well
- Adding a skill would add noise without adding value

Document your analysis before building anything.

---

## STEP 2 — Define skill profiles

For each phase that needs a skill, define a profile:

```
Phase: [phase name]
Domain: [what technical area]
A skill for this phase must know:
  - [specific knowledge point 1]
  - [specific knowledge point 2]
  - [specific knowledge point 3]
Must detect and prevent:
  - [anti-pattern or common mistake 1]
  - [anti-pattern or common mistake 2]
Must NOT include:
  - [out of scope knowledge that would add noise]
```

Present all profiles to the user before searching the repo:
"Here are the skill profiles I need to fill. Let me now search SKILL_REPO.md for candidates."

---

## STEP 3 — Search SKILL_REPO.md

For each profile, search `SKILL_REPO.md` for relevant skills in that category.

For each candidate skill found:
- Read its description and purpose carefully
- Evaluate: does it cover what the profile needs?
- Identify: what does it do well? What is it missing? What does it do that we don't need?

If SKILL_REPO.md has no skills for a profile → use find-skills to search skills.sh before declaring a gap.
Query find-skills with the domain and stack keywords from the profile (e.g., "supabase RLS", "clerk auth next.js").
Evaluate any results found the same way as SKILL_REPO.md candidates.
Only declare a gap if both SKILL_REPO.md and find-skills return nothing useful.

If SKILL_REPO.md has multiple candidates → evaluate all of them.

---

## STEP 4 — Build skill proposals

For each phase that needs a skill, build a proposal combining the best ideas from SKILL_REPO.md candidates plus your own technical knowledge.

Present each proposal to the user BEFORE creating the skill file:

```
---
SKILL PROPOSAL: [descriptive name]
For phase: [phase name]

What this skill does:
[2-3 sentences describing its purpose and scope]

Key capabilities:
- [specific capability 1]
- [specific capability 2]
- [specific capability 3]

Anti-patterns it prevents:
- [what it catches and stops]

Ideas taken from SKILL_REPO.md:
- From [skill name]: [specific idea borrowed]
- From [skill name]: [specific idea borrowed]
[If repo had nothing relevant: "No relevant skills found in repo — built from scratch"]

What I add beyond the repo:
- [knowledge or heuristic not found in any repo skill]

Scope boundary (what this skill deliberately excludes):
- [what it does NOT cover to stay focused]

Classification: BLOCKING | RECOMMENDED | OPTIONAL
Reason: [why this classification]
---
```

After presenting ALL proposals, ask:
"Do these skill proposals look right? Any to modify, remove, or add before I create the files?"

Do NOT create any skill files until the user approves the proposals.

---

## STEP 5 — Create skill files

After user approval, create each skill file in `.claude/skills/project/[skill-name].md`.
Create the `.claude/skills/project/` directory if it does not exist.

Each skill file must follow this structure:

```markdown
---
name: [skill-name]
description: [one sentence — when to use this skill and what it does]
---

<instructions>

# [Skill Name]

## Purpose
[What this skill does and why it exists in this project]

## This skill activates when
[The specific moment or task that triggers this skill]

## Core knowledge

### [Topic 1]
[Specific, concrete guidance — not generic advice]
[Heuristics with defaults and invalidation factors]
[Anti-patterns to detect and stop]

### [Topic 2]
...

## Acceptance criteria for this phase
[Copy from PLAN.md — what done looks like for this phase]

## What this skill must never do
[Explicit list of out-of-scope actions]

</instructions>
```

Rules for skill files:
- Specific over generic — "use Supabase RLS with auth.uid()" not "follow security best practices"
- Include concrete examples where they prevent real mistakes
- Keep scope tight — a focused skill beats a comprehensive one
- No skill should exceed what can be read and applied in one context window

---

## STEP 6 — Write SKILL_SELECTION.md

After all skills are created, write `.forge/SKILL_SELECTION.md`:

```markdown
# Skill Selection
Generated: [YYYY-MM-DD]

## Always-on skills (active every session)
- caveman — token optimization, terse communication
- napkin — per-project mistake memory
- forge:sync — live context updater

## Phase skill assignments

### Phase 0 — Setup & base
Skills: [none needed / or skill name]

### Phase 1 — [Name]
Skills: [skill name] — BLOCKING
Reason: [why this skill is blocking for this phase]

### Phase 2 — [Name]
Skills: [skill name] — RECOMMENDED
Reason: [why recommended]

[Continue for all phases]

## Detected gaps
[Phases where no suitable skill was found in SKILL_REPO.md and no custom skill was created]
[If none: "No gaps detected"]

## Skills created this session
[List of new skill files created with their paths]
```

---

## STEP 7 — Final confirmation and handoff

Present SKILL_SELECTION.md to the user.
Ask: "Does the skill assignment look correct? Ready to move to forge:dispatch?"

After approval: call forge:sync, then pass to forge:dispatch.

---

## What forge:selector must NEVER do

- Never create a skill file without user approval of the proposal first
- Never create generic skills — every skill must be specific to the project's stack and needs
- Never assign a skill as BLOCKING unless the phase genuinely cannot produce good output without it
- Never skip the SKILL_REPO.md search — always check what exists before building from scratch
- Never combine unrelated capabilities into one skill — one skill, one domain
- Never pass to forge:dispatch without explicit user approval of SKILL_SELECTION.md

</instructions>
