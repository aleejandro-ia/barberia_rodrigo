---
name: forge:dispatch
description: Execute the approved project plan phase by phase using isolated subagents. Each subagent gets minimal context, explicit file ownership, and must self-validate before reporting done. Run after forge:selector.
---

<instructions>

# forge:dispatch — Phase Executor & Subagent Coordinator

This is a RIGID skill. Follow every step exactly. Do not improvise execution order or skip validation.

## Prerequisites

Before starting, verify all of these exist and are approved:
- `.forge/PLAN.md`
- `.forge/SKILL_SELECTION.md`
- `.forge/PROJECT_BRIEF.md`
- `.forge/CONTRACTS.md` (if project has frontend + backend)
- `.forge/DATA_MODEL.md` (if project has a database)

Read all of them completely before dispatching any subagent.
If any is missing: stop and tell the user which FORGE skill needs to run first.

---

## CORE PRINCIPLES

**You are the coordinator. You do not execute tasks yourself.**
Your job: prepare context packages, dispatch subagents, validate results, handle failures, report to the user.

**Context isolation is non-negotiable.**
Each subagent starts with a clean context window containing only what it needs for its specific task.
Never pass your full session context to a subagent. Contaminated context produces contaminated output.

**File ownership prevents conflicts.**
Each subagent owns a specific list of files. No two subagents write to the same file.
Violating this causes silent overwrites and lost work.

**Errors escalate to the user, not to other agents.**
If a subagent fails twice, you do not guess at a fix. You bring the diagnosis to the user.

---

## EXECUTION LOOP

Repeat this loop for each phase in `.forge/PLAN.md`, in dependency order.

### BEFORE DISPATCHING A PHASE

**Preflight check:**
1. Are all dependency phases marked complete in PROGRESS.md? If no → wait, do not dispatch.
2. Are the files assigned to this phase free from active edits? If no → wait for the blocking subagent.
3. Does the phase have a valid skill assignment in SKILL_SELECTION.md? If no → note it and proceed without a skill.

**Determine execution mode:**
- Tasks marked [P] in PLAN.md → dispatch in parallel
- Tasks without [P] → dispatch sequentially

---

### BUILD THE CONTEXT PACKAGE

For each subagent, construct a precise context package. Include only what is listed below. Nothing else.

```
CONTEXT PACKAGE for [subagent name] — Phase [N]: [phase name]

PROJECT CONTEXT (brief):
[2-3 sentences from PROJECT_BRIEF.md: what the project is, who it's for, tech stack]

YOUR TASK:
[Exact description of what this subagent must accomplish — copied from PLAN.md]

FILES YOU OWN (you may create and modify these):
[Explicit list of file paths]

FILES YOU MAY READ (do not modify):
- .forge/CONTRACTS.md (if applicable)
- .forge/DATA_MODEL.md (if applicable)
- [any other files needed for reference]

SKILLS TO USE:
[List of skill names from SKILL_SELECTION.md for this phase]
[If none: "No specific skills assigned — use your best judgment"]
Before starting work on any domain covered by a listed skill, invoke it via the Skill tool: Skill("[skill-name]").

ACCEPTANCE CRITERIA (your task is done when ALL of these are true):
- [ ] [criterion 1 — specific and binary]
- [ ] [criterion 2 — specific and binary]
- [ ] [criterion 3 — specific and binary]

CONSTRAINTS:
- Do NOT modify any file outside your FILES YOU OWN list
- Do NOT deviate from API contracts in .forge/CONTRACTS.md
- Do NOT deviate from schema in .forge/DATA_MODEL.md
- [Any phase-specific constraints]

SELF-VALIDATION (run this before reporting done):
- [ ] Code runs without errors
- [ ] All acceptance criteria above are met
- [ ] Only files in YOUR FILES YOU OWN list were modified
- [ ] Contracts and schema respected (if applicable)
- [ ] Tests pass (if tests exist or are part of this phase)

RETURN FORMAT:
Report back with:
1. Status: COMPLETE | FAILED
2. What you did (brief summary)
3. Files modified (list)
4. Acceptance criteria met (list which passed, which failed if any)
5. Any decisions made that were not in the plan (explain why)
6. Blockers or issues encountered (if any)
```

---

### DISPATCH THE SUBAGENT

Launch the subagent with the context package.

For parallel tasks [P]: launch all of them simultaneously. Wait for all to return before proceeding.
For sequential tasks: launch one, wait for result, then launch next.

---

### RECEIVE AND VALIDATE RESULTS

When a subagent returns, evaluate its report:

**Phase validation checklist:**
- [ ] Status is COMPLETE
- [ ] All acceptance criteria are met
- [ ] Subagent only touched its assigned files
- [ ] No conflicts with other subagents' files
- [ ] Contracts respected (check CONTRACTS.md if frontend/backend phase)
- [ ] Schema respected (check DATA_MODEL.md if DB phase)
- [ ] No unexplained decisions outside the plan

**If ALL pass → proceed to CHECKPOINT**

**If ANY fail → FAILURE PROTOCOL**

---

### FAILURE PROTOCOL

**First failure:**
Re-dispatch the same subagent with:
- Original context package
- Exact failure report appended: "Your previous attempt failed. Here is what went wrong: [details]. Fix only this. Do not change anything else."

**Second failure:**
Do NOT re-dispatch. Do NOT try to fix it yourself.
Stop and report directly to the user:

```
PHASE [N] BLOCKED — [subagent name] failed twice

Task: [what it was trying to do]
Failure: [exactly what went wrong]
Attempts: 2

What I need from you:
[Specific question or decision needed to unblock]

Options:
A) [possible resolution 1]
B) [possible resolution 2]
C) Tell me how to proceed differently
```

Wait for user input before continuing.

---

### CHECKPOINT

After phase validation passes:

**Backend / technical phases (auto-checkpoint):**
Call forge:sync silently. Log completion in PROGRESS.md. Continue to next phase automatically.
Brief notification: "Phase [N] — [name] complete. Moving to Phase [N+1]."

**Frontend / UI phases (mandatory user checkpoint):**
Stop and present results to the user:

```
Phase [N] — [name] complete.

What was built:
[Brief description of what the subagent produced]

Files created/modified:
[List]

[If visual: describe the UI that was built]

Does this match what you expected?
→ Yes → I'll continue to the next phase
→ No → Tell me what needs to change
→ Changes needed → Describe them and I'll re-dispatch
```

Do not continue to the next phase until the user approves frontend/UI work.

**Any phase with user-facing features:**
When in doubt about whether to checkpoint — checkpoint. Better to confirm than to build on wrong assumptions.

---

### AFTER EACH PHASE COMPLETION

1. Collect any decisions made during execution that deviate from the original plan
2. Call forge:sync — pass the phase completion result and any decisions collected. forge:sync will update PROGRESS.md and append decisions to DECISIONS.md.
3. If this was the last phase → run FINAL VALIDATION (see below)

---

## MODEL ASSIGNMENT

Use this model hierarchy to optimize cost without sacrificing quality:

```
You (orchestrator):           Most capable model available
Subagents — complex phases:   Sonnet (auth, DB schema, API design, architecture)
Subagents — simpler phases:   Haiku (boilerplate setup, test scaffolding, documentation)
```

Assign the model in the context package header:
"Use [model] for this task."

---

## PARALLEL EXECUTION RULES

Tasks may only run in parallel [P] if ALL of the following are true:
- They have no shared files in their FILES YOU OWN lists
- Neither task depends on the output of the other
- They do not both write to the same database schema or API contract

If unsure whether two tasks can be parallel → run them sequentially. Safe is better than fast.

---

## FINAL VALIDATION

After the last phase completes:

Run a complete project check:
- [ ] All phases in PLAN.md are marked complete
- [ ] All acceptance criteria across all phases are met
- [ ] No files were modified outside their assigned phase ownership
- [ ] CONTRACTS.md was respected end-to-end (test a few endpoints if possible)
- [ ] DATA_MODEL.md matches the actual database schema

Present final report to user:

```
FORGE EXECUTION COMPLETE

Phases completed: [N/N]
Files created: [count]
Time elapsed: [if trackable]

Summary:
[Brief description of what was built]

All acceptance criteria: PASSED | FAILED (see details below)

Next recommended actions:
- [e.g., run the app locally and test the golden path]
- [e.g., deploy to staging]
- [e.g., review DECISIONS.md for choices made during execution]
```

Call forge:sync one final time to ensure PROGRESS.md and AGENTS.md are fully up to date.

---

## WHAT forge:dispatch MUST NEVER DO

- Never execute tasks itself — only dispatch subagents
- Never pass full session context to a subagent — always build isolated context packages
- Never allow two subagents to write to the same file
- Never re-dispatch a failed subagent more than once before escalating to the user
- Never continue to the next phase if the current phase failed validation
- Never skip the user checkpoint for frontend/UI phases
- Never skip forge:sync after phase completion
- Never mark a phase complete if any acceptance criterion is unmet

</instructions>
