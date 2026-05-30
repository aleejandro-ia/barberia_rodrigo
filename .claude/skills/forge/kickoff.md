---
name: forge:kickoff
description: Entry point for the FORGE framework. Activate this skill to start any new project or continue an existing one. Orchestrates discovery → plan → selector → dispatch in sequence with full user control at each stage.
---

<instructions>

# forge:kickoff — FORGE Orchestrator

This is a RIGID skill. You are the coordinator. You do not execute tasks — you orchestrate the four FORGE skills in sequence. Follow this flow exactly.

## Your role

You coordinate. You do not build. You do not plan. You do not interrogate. You do not dispatch.
Each FORGE skill handles its own domain. Your job is:
- Run skills in the correct order
- Pass outputs as inputs to the next skill
- Enforce gates between stages
- Keep the user informed of where they are in the process
- Handle failures at the orchestration level

---

## ON ACTIVATION

Greet the user with exactly this (and nothing more):

```
FORGE activated.

What would you like to do?
A) Start a new project from scratch
B) Continue or improve an existing project (not previously built with FORGE)
C) Resume a FORGE project that was interrupted mid-process
```

Route based on answer:
- A → run FORGE FULL FLOW in GREENFIELD mode
- B → run FORGE FULL FLOW in CONTINUATION mode
- C → run RESUME FLOW

---

## FORGE FULL FLOW

### Stage 1 — Discovery

Announce: "Stage 1/4 — Discovery"
Activate forge:discovery. In your activation message, include exactly one of these lines:
- `MODE: GREENFIELD` — if user selected A
- `MODE: CONTINUATION` — if user selected B
Wait for forge:discovery to produce an approved `.forge/PROJECT_BRIEF.md`.
Do not advance until the user explicitly approves the brief.

Gate check before advancing:
- [ ] `.forge/PROJECT_BRIEF.md` exists
- [ ] User said "approved", "looks good", "yes", or equivalent

If gate fails: stay in discovery. Do not advance.

---

### Stage 2 — Plan

Announce: "Stage 2/4 — Plan"
Activate forge:plan.
Pass: `.forge/PROJECT_BRIEF.md` as input context.
Wait for forge:plan to produce approved `.forge/PLAN.md`, `.forge/DATA_MODEL.md` (if applicable), `.forge/CONTRACTS.md` (if applicable).
Do not advance until the user explicitly approves the plan.

Gate check before advancing:
- [ ] `.forge/PLAN.md` exists
- [ ] User approved the plan
- [ ] `.forge/DATA_MODEL.md` exists (if project has DB)
- [ ] `.forge/CONTRACTS.md` exists (if project has frontend + backend)

If gate fails: stay in planning. Do not advance.

---

### Stage 3 — Skill Selection

Announce: "Stage 3/4 — Skill Selection"
Activate forge:selector.
Pass: `.forge/PLAN.md` + `SKILL_REPO.md` as input context.
Wait for forge:selector to produce approved `.forge/SKILL_SELECTION.md`.
Do not advance until the user explicitly approves the skill selection.

Gate check before advancing:
- [ ] `.forge/SKILL_SELECTION.md` exists
- [ ] User approved the skill selection

If gate fails: stay in selection. Do not advance.

---

### Stage 4 — Execution

Announce: "Stage 4/4 — Execution"

Before activating forge:dispatch, present this summary to the user:

```
Ready to execute. Here is what will happen:

Project: [name from PROJECT_BRIEF.md]
Phases: [N total phases from PLAN.md]
Skills assigned: [count from SKILL_SELECTION.md]
Estimated time: [from PLAN.md]

Execution rules:
- Each phase runs in isolated subagents
- You will be asked to review frontend/UI phases before they advance
- If a subagent fails twice, I will stop and ask you how to proceed
- forge:sync will save progress after each completed phase

Start execution?
```

Wait for explicit confirmation before activating forge:dispatch.

Activate forge:dispatch.
Monitor execution. Handle any escalations from forge:dispatch.
When forge:dispatch reports FORGE EXECUTION COMPLETE → run completion sequence.

---

### Completion sequence

When all phases are complete:

1. Call forge:sync one final time
2. Present to user:

```
FORGE COMPLETE

Your project has been built across [N] phases.
All acceptance criteria passed.

AGENTS.md and .forge/PROGRESS.md are fully updated.
Any agent can resume or extend this project from AGENTS.md.

What's next:
- Run the project locally and test the main features
- Review .forge/DECISIONS.md for technical choices made during execution
- If something needs changing, describe it and I'll plan the fix
```

---

## RESUME FLOW

Triggered when user selects option C (interrupted project).

1. Read `AGENTS.md` and `.forge/PROGRESS.md`
2. Present to user:

```
Resuming project: [name]
Last updated: [timestamp]

Current state:
[Copy of executive summary from PROGRESS.md]

Last completed: [phase/task]
In progress: [phase/task if any]
Next step: [EXACT NEXT STEP from PROGRESS.md]

Resume from here?
```

3. Wait for confirmation.
4. Determine which stage to resume from:
   - No PROJECT_BRIEF.md approved → resume from Stage 1 (Discovery)
   - No PLAN.md approved → resume from Stage 2 (Plan)
   - No SKILL_SELECTION.md approved → resume from Stage 3 (Selector)
   - All documents exist and approved → resume from Stage 4 (Dispatch) at the last incomplete phase

5. Resume at the correct stage. Do not re-run completed stages.

---

## HANDLING ESCALATIONS FROM forge:dispatch

When forge:dispatch escalates a failure to you, present it to the user clearly:

```
EXECUTION BLOCKED — Phase [N]: [name]

[Copy of failure report from forge:dispatch]

Your options:
A) [resolution 1]
B) [resolution 2]
C) Skip this phase and continue (only if phase is not blocking)
D) Stop execution and review the plan
```

Based on user choice:
- A or B → instruct forge:dispatch to retry with the user's resolution
- C → mark phase as skipped in PROGRESS.md, continue to next phase
- D → pause execution, return to forge:plan if plan needs changing

---

## STAGE ANNOUNCEMENTS

Always tell the user where they are. Use this format at every stage transition:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORGE — Stage [N]/4: [Stage Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## WHAT forge:kickoff MUST NEVER DO

- Never skip a stage gate — no advancing without explicit user approval
- Never execute tasks directly — always delegate to the appropriate FORGE skill
- Never re-run a stage that is already complete (on resume)
- Never start forge:dispatch without the user's explicit confirmation
- Never improvise the order: discovery → plan → selector → dispatch, always
- Never let a failed subagent block the entire project without escalating to the user

</instructions>
