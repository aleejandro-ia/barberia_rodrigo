---
name: forge:plan
description: Transform an approved PROJECT_BRIEF.md into a complete technical architecture with phased plan, data model, API contracts, and subagent assignments. Run after forge:discovery, before forge:selector.
---

<instructions>

# forge:plan — Architecture & Phase Planner

This is a RIGID skill. Follow every step exactly. Do not skip steps or merge phases.

## Prerequisites

Before starting, verify:
- `.forge/PROJECT_BRIEF.md` exists and has been approved by the user
- If not: stop and tell the user to run forge:discovery first

Read `.forge/PROJECT_BRIEF.md` completely before doing anything else.

---

## STEP 1 — Architecture decision

Based on PROJECT_BRIEF.md, decide the project structure. Present your choice to the user before proceeding.

### Structure options

**Option A — Modular monolith (default for solo/small team)**
Single deployable unit. Clear internal module boundaries.
Use when: solo developer, small team, validating idea, no proven scale need.

**Option B — Web app with separate frontend and backend**
Frontend (Next.js/React) + Backend (API) as separate concerns but same deployment.
Use when: frontend and backend will be developed semi-independently, clear API boundary needed.

**Option C — Mobile + API**
Mobile app (React Native) + Backend API.
Use when: primary interface is mobile with dedicated API.

Present your recommendation with reasoning. Ask: "Does this structure make sense for your project?"
Do not continue until the user confirms the structure.

### Decision record

For every non-obvious architectural decision, add an entry to `.forge/DECISIONS.md`:
```
[YYYY-MM-DD] [Decision] — Reason: [why this over alternatives]
```

---

## STEP 2 — Pre-code documents

Generate these documents BEFORE any phase plan. They must exist before any subagent writes a single line of code.

### DATA_MODEL.md (only if project has a database)

Write `.forge/DATA_MODEL.md` with:

```markdown
# Data Model
Generated: [YYYY-MM-DD]

## Entities

### [EntityName]
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | |
| [field] | [type] | [NOT NULL / UNIQUE / etc] | [purpose] |
| created_at | timestamp | NOT NULL DEFAULT now() | |

### [EntityName]
...

## Relationships
- [Entity A] has many [Entity B] via [field]
- [Entity A] belongs to [Entity B] via [field]

## Indexes
- [table]([field]) — reason: [why this index]

## Notes
[Any important constraints, business rules, or design decisions]
```

Rules:
- Every table needs id and created_at minimum
- Define relationships explicitly — no implicit foreign keys
- Include indexes for fields that will be frequently queried
- If using Supabase: note which tables need Row Level Security

### CONTRACTS.md (only if project has both frontend and backend)

Write `.forge/CONTRACTS.md` with:

```markdown
# API Contracts
Generated: [YYYY-MM-DD]

## Base URL
[/api/v1 or equivalent]

## Authentication
[How requests are authenticated — Bearer token, session cookie, etc.]

## Endpoints

### [Resource Name]

#### GET /[resource]
Purpose: [what this returns]
Auth required: yes/no
Query params:
  - [param]: [type] — [description]
Response 200:
```json
{
  "data": [...],
  "meta": { "total": 0 }
}
```
Response 401: { "error": "Unauthorized" }
Response 404: { "error": "Not found" }

#### POST /[resource]
Purpose: [what this creates]
Auth required: yes/no
Request body:
```json
{
  "[field]": "[type] — required/optional"
}
```
Response 201: { "data": { ... } }
Response 400: { "error": "Validation error", "details": [...] }

[Continue for all endpoints]

## Shared types
[TypeScript interfaces or equivalent for shared data structures]

## Error format
All errors follow: { "error": "[message]", "code": "[error_code]" }
```

Rules:
- Define ALL endpoints before any subagent writes frontend or backend code
- Frontend and backend subagents must not deviate from these contracts
- Include all possible response codes per endpoint
- Define shared TypeScript types if applicable

### User validation

Present DATA_MODEL.md and CONTRACTS.md to the user:
"Here are the data model and API contracts. Review them before I generate the phase plan. Any changes now are cheap — changes after implementation are expensive."

Do not proceed to STEP 3 until the user approves both documents.

---

## STEP 3 — Phase plan

Generate the full phase plan based on PROJECT_BRIEF.md and the approved architecture.

### Standard phases — include only what applies to this project

```
Phase 0 — Setup & base
  What: project scaffolding, folder structure, environment config, CI/CD base
  Always included

Phase 1 — Database & schema
  What: create DB, run migrations, seed data if needed
  Include if: project has a database
  Must complete before: Phase 3 (Auth), Phase 4 (Backend)

Phase 2 — Authentication
  What: auth provider setup, session management, route protection
  Include if: project has user accounts
  Must complete before: Phase 4 (Backend — auth middleware), Phase 5 (Frontend — protected routes)

Phase 3 — Backend / API
  What: all API endpoints per CONTRACTS.md
  Include if: project has a backend
  Must complete before: Phase 5 (Frontend)
  Dependency: CONTRACTS.md must be approved

Phase 4 — Frontend / UI
  What: all user-facing screens and components
  Include if: project has a frontend
  Special: this phase has mandatory user checkpoints — more conversational
  Dependency: CONTRACTS.md must be approved, Phase 3 recommended but not blocking

Phase 5 — External integrations
  What: third-party APIs, payment processing, email, storage, etc.
  Include if: project has external integrations
  Can run parallel [P] with Phase 4 if no shared state

Phase 6 — Testing
  What: unit tests, integration tests, E2E tests
  Include if: project requires test coverage
  Can run partially parallel [P] with implementation phases

Phase 7 — Deploy & infrastructure
  What: production environment, domain, env vars, monitoring
  Always included as final phase
```

### Phase plan format

Write the phase plan directly into `.forge/PLAN.md`:

```markdown
# Project Plan
Generated: [YYYY-MM-DD]
Project: [name from PROJECT_BRIEF]
Structure: [Option A/B/C]

## Phase Overview
[Table of phases, status, dependencies]
| Phase | Name | Depends on | Parallel [P] | Subagent |
|-------|------|------------|--------------|---------|
| 0 | Setup & base | — | — | subagent-setup |
| 1 | Database & schema | 0 | — | subagent-db |
| ... | | | | |

## Detailed Phases

### Phase 0 — Setup & base
**Subagent:** subagent-setup
**Depends on:** nothing
**Parallel:** no
**Acceptance criteria:**
- [ ] Project runs locally with zero errors
- [ ] Environment variables documented
- [ ] Folder structure matches chosen architecture
- [ ] Git repository initialized with .gitignore
**Estimated time:** [X hours/days]
**Files owned by this subagent:** [list]

### Phase 1 — [Name]
**Subagent:** subagent-[name]
**Depends on:** Phase [N]
**Parallel:** [yes [P] / no]
**Acceptance criteria:**
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]
**Estimated time:** [X hours/days]
**Files owned by this subagent:** [list]
**Skills to request:** [hint for forge:selector — what kind of skill is needed]

[Continue for all phases]

## Total estimate
Size: [Small/Medium/Large]
Total time range: [X weeks/months]
Main risk: [biggest technical uncertainty]
```

Rules for phase plan:
- Every phase has explicit acceptance criteria — not "build the auth" but "user can sign up, log in, log out, and session persists on refresh"
- Every phase has explicit file ownership — subagents cannot touch files outside their list
- Parallel [P] only when phases have truly zero shared state
- Acceptance criteria must be binary — either done or not done, no ambiguity
- Time estimates are rough — they will be refined during execution

---

## STEP 4 — Final validation

Present the complete plan to the user:
"Here is the full phase plan. Review it before I pass to forge:selector."

Show:
1. Architecture choice and reasoning
2. Phase overview table
3. Total estimate
4. Any risks or dependencies worth highlighting

Ask: "Does this plan make sense? Any phases to add, remove, or reorder?"

Apply changes if requested. Re-present until approved.

Do NOT call forge:selector until the user explicitly approves the plan.

After approval: call forge:sync to save current state, then pass to forge:selector.

---

## Technical principles embedded in this skill

**Contracts before code:**
Never let frontend and backend subagents start coding before CONTRACTS.md is approved.
One agent building against assumed contracts = guaranteed rework.

**Acceptance criteria over descriptions:**
"Build the login page" is not an acceptance criterion.
"User can enter email + password, submit form, receive JWT, and be redirected to dashboard" is.

**File ownership prevents conflicts:**
Each subagent gets a locked list of files. No two subagents share write access to the same file.
Read access is allowed. Write access is exclusive.

**Dependencies are hard blocks:**
Phase 3 (Backend) cannot start if Phase 1 (Database) is not complete.
A subagent that tries to build API endpoints without a DB schema will produce garbage.

---

## What forge:plan must NEVER do

- Never generate the phase plan before DATA_MODEL.md and CONTRACTS.md are approved
- Never assign the same file to two different subagents
- Never mark phases as parallel [P] if they share any write state
- Never write vague acceptance criteria ("build X", "implement Y")
- Never pass to forge:selector without explicit user approval
- Never skip the decision record for non-obvious choices

</instructions>
