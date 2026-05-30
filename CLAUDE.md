# FORGE — Project Instructions for Claude

## On every session start — do this before anything else

1. Read `AGENTS.md` — understand what this project is and where it stands
2. Read `.forge/PROGRESS.md` — know exactly what's done, what's in progress, what's next
3. Read `.claude/napkin.md` if it exists — recall past mistakes and corrections for this project
4. Do NOT start any work until you have read all three

## Always-on behavior

**Caveman mode ultra** — active at all times in this project.
Drop articles, filler, pleasantries, hedging. Fragments OK. Technical terms exact. Code blocks unchanged.
Off only if user says "stop caveman" or "normal mode".

**Napkin** — active every session automatically.
Read `.claude/napkin.md` before working. Update it when: you make a mistake and get corrected, you discover a project-specific pattern that should be remembered, a preference is confirmed.
Keep only recurring high-value guidance. Cap each category at 10 items.

## forge:sync — when to execute

Execute `forge:sync` in these exact moments:

- After any phase marked complete in PLAN.md
- When you detect the context window is approaching its limit — execute IMMEDIATELY before continuing
- When the user asks you to save or sync manually

Do NOT execute forge:sync constantly or after every small action — only at the moments above.

## FORGE framework — how to use it

This project uses the FORGE framework. The skills live in `.claude/skills/forge/`.

Available FORGE skills:
- `forge:kickoff` — start a new project from scratch
- `forge:discovery` — project interrogation and technical advisory
- `forge:plan` — architecture and phase planning
- `forge:selector` — skill profiling and selection
- `forge:dispatch` — subagent execution with validation
- `forge:sync` — live context updater

When the user activates any forge: skill, follow its instructions exactly. These are rigid skills — do not adapt or shortcut them.

## Installed supporting skills

These skills are installed and available in every session:

- `napkin` — per-project mistake memory. Lives at `.claude/napkin.md`. Read at session start, update when corrections happen.
- `find-skills` — search skills.sh directly from within a session. Use during forge:selector when searching for skill candidates. Installed at `.agents/skills/find-skills`.

## SKILL_REPO.md — how it works

`SKILL_REPO.md` is the curated skill repository for forge:selector.
It is NOT pre-filled. It grows organically:
1. A project completes
2. Skills used are evaluated on real results
3. Skills that performed well get added to SKILL_REPO.md with notes
4. Skills that failed or were generic get noted as "not recommended"

Use `find-skills` to search skills.sh when forge:selector needs candidates for a new project.
Evaluate quality before adding anything to SKILL_REPO.md — installs ≠ quality.

## Project context files — what they are and what NOT to do

```
AGENTS.md              ← universal context — updated only by forge:sync
.forge/PROJECT_BRIEF.md ← updated only by forge:discovery
.forge/PLAN.md          ← updated only by forge:plan
.forge/CONTRACTS.md     ← updated only by forge:plan
.forge/DATA_MODEL.md    ← updated only by forge:plan
.forge/SKILL_SELECTION.md ← updated only by forge:selector
.forge/DECISIONS.md     ← updated by forge:plan (architecture decisions) + forge:sync (execution decisions)
.forge/PROGRESS.md      ← updated only by forge:sync
```

Never modify these files manually outside of their designated FORGE skill.

## General behavior rules

- Read before writing — always check what exists before creating or modifying
- Do not skip FORGE phases — if the user asks to jump ahead, warn them and explain why order matters
- File ownership — during forge:dispatch, subagents only touch their assigned files. Never cross boundaries.
- When context approaches limit — save via forge:sync first, then warn the user
- Technical decisions — if you make a non-obvious technical decision, log it in `.forge/DECISIONS.md`
