---
name: forge:sync
description: Update live project context after each completed phase or task. Keeps PROGRESS.md and AGENTS.md accurate so any agent can resume work cold. Call automatically after phase completion or manually at any time.
---

<instructions>

# forge:sync — Live Context Updater

This is a RIGID skill. Follow every step exactly. Do not skip, summarize, or reorder.

## When this skill runs

- Called automatically by forge:dispatch after each completed phase
- Called manually by the user at any time
- Called as EMERGENCY SAVE when context or credits are near the limit

## What you must do

### STEP 1 — Read current state

Read ALL of these files before writing anything (skip any that do not exist yet):
- `.forge/PROJECT_BRIEF.md`
- `.forge/PLAN.md`
- `.forge/PROGRESS.md` (existing state, if any)
- `.forge/DECISIONS.md` (if exists)
- `.forge/SKILL_SELECTION.md` (if exists)

Also read the current conversation to understand:
- Which phase just completed (or which task within a phase)
- What was the result
- If anything failed or was modified from the original plan
- If any new technical decisions were made during execution

### STEP 2 — Update PROGRESS.md

Overwrite `.forge/PROGRESS.md` completely with this exact structure:

```
# Project Progress
# Last updated: [YYYY-MM-DD HH:MM]
# Session: [current session identifier if available]

## Executive Summary
[2-3 sentences: what the project is, where it stands right now, what comes next]

## Phase Status

[For each phase in PLAN.md, use one of these statuses:]

✅ PHASE [N] — [Phase name] [completed YYYY-MM-DD HH:MM]

🔄 PHASE [N] — [Phase name] [IN PROGRESS]
   ✅ Task [N.1] — [task name] [completed]
   ✅ Task [N.2] — [task name] [completed]
   🔄 Task [N.3] — [task name] [IN PROGRESS — INCOMPLETE]
        Last known state: [what was done within this task]
        Pending: [what still needs to be done to complete this task]
        Modified files so far: [list of files touched]
        Resume from: [exact file:line or description of where to continue]
   ⏳ Task [N.4] — [task name] [pending]

⏳ PHASE [N] — [Phase name] [pending]

## Technical Decisions Log
[YYYY-MM-DD] [Decision made] — Reason: [why]
[YYYY-MM-DD] [Decision made] — Reason: [why]

## Key Files
[file path] — [what it does, one line]
[file path] — [what it does, one line]

## EXACT NEXT STEP
[One precise instruction: what to do next, which file, which task, which phase]
[This must be specific enough that an agent with zero context can follow it]
```

Rules for PROGRESS.md:
- Never leave EXACT NEXT STEP vague. "Continue phase 3" is wrong. "Continue Task 3.3 in src/middleware/auth.ts — protect /admin and /api/* routes" is correct.
- If a task was interrupted mid-execution, document the exact state at interruption.
- If files were modified, list them with their purpose.
- Never delete completed phase entries — the full history must be preserved.

### STEP 3 — Update AGENTS.md

Overwrite `AGENTS.md` completely with this exact structure:

```
# [Project Name] — Agent Context
# Last updated: [YYYY-MM-DD HH:MM]
# READ THIS ENTIRE FILE before doing anything in this project.

## What is this project
[2-3 sentences from PROJECT_BRIEF.md — what it does, who it's for, what stack]

## Current State
Phase [N] of [total] — [phase name] — [status]
Full detail: see .forge/PROGRESS.md

## EXACT NEXT STEP
[Copy exactly from PROGRESS.md EXACT NEXT STEP section]

## Tech Stack
[List: framework, database, auth, deploy, AI if applicable]

## Important Files
[file path] — [what it does]
[file path] — [what it does]

## API Contracts
[If CONTRACTS.md exists: "See .forge/CONTRACTS.md — do not deviate from these contracts"]

## Do NOT touch
[List files or areas that must not be modified — from PLAN.md constraints]

## FORGE Documents
- .forge/PROJECT_BRIEF.md — requirements and technical decisions
- .forge/PLAN.md — full phase plan
- .forge/CONTRACTS.md — API contracts between front and back
- .forge/DATA_MODEL.md — database schema
- .forge/SKILL_SELECTION.md — skills assigned per phase
- .forge/DECISIONS.md — decision record
- .forge/PROGRESS.md — live project state (most important)
```

Rules for AGENTS.md:
- EXACT NEXT STEP must always be the first actionable thing after reading this file.
- Any agent reading AGENTS.md + PROGRESS.md must know exactly what to do in under 60 seconds.
- No vague language. No "see the plan for details" without also giving the short version here.

### STEP 4 — Update DECISIONS.md (only if new decisions were made)

If during the last phase or task any technical decision was made that was NOT already in DECISIONS.md, append it:

```
[YYYY-MM-DD] [What was decided] — Reason: [why this over alternatives]
```

Do not rewrite existing entries. Only append.

### STEP 5 — Confirm to user

After updating all files, report:

```
forge:sync complete — [YYYY-MM-DD HH:MM]

Updated:
- PROGRESS.md — [brief description of what changed]
- AGENTS.md — [brief description of what changed]
[- DECISIONS.md — [new decision logged] (only if applicable)]

Next step: [copy of EXACT NEXT STEP]
```

## Emergency Save Protocol

If forge:sync is triggered because context or credits are near the limit:

1. Execute all steps above immediately, prioritizing PROGRESS.md and AGENTS.md.
2. In PROGRESS.md, add this block at the very top under the header:

```
⚠️ EMERGENCY SAVE — Session ended unexpectedly at [YYYY-MM-DD HH:MM]
Current task was interrupted. Resume from EXACT NEXT STEP below.
```

3. Make EXACT NEXT STEP as specific as possible — include file, line number if known, and what was being done at the moment of interruption.
4. Warn the user: "Context limit approaching — forge:sync emergency save completed. Resume in a new session using AGENTS.md."

## What forge:sync must NEVER do

- Never modify .forge/PROJECT_BRIEF.md, .forge/PLAN.md, .forge/CONTRACTS.md, or .forge/DATA_MODEL.md — those are outputs of other FORGE skills
- Never delete history from PROGRESS.md — only update and append
- Never summarize or shorten EXACT NEXT STEP for brevity — precision over brevity here
- Never skip the confirmation report to the user

</instructions>
