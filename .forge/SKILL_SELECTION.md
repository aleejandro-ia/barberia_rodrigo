# Skill Selection
Generated: 2026-05-31
Phase: POST-16 — Visual Overhaul + Admin Reorganización + Horarios Backend

## Always-on skills (active every session)
- caveman — token optimization, terse communication
- napkin — per-project mistake memory
- forge:sync — live context updater

## Phase skill assignments

### P16-A — Tipografía (globals.css + landing headings)
Skills: none
Reason: CSS clamp() puro, sin decisiones peligrosas. Riesgo bajo. Context suficiente en dispatch prompt.
Critical notes in dispatch: Tailwind v4 → NO tailwindcss plugin en postcss; NO tocar Dancing Script decorativos.

### P16-B — Calendario Landing (BookingCalendar redesign)
Skills: `design-taste-frontend` — RECOMMENDED
Reason: Rediseño visual en contexto premium/luxury. design-taste-frontend previene degradación de calidad visual y patrones AI-slop. Mantiene coherencia con el resto de la landing (ya diseñada con este skill).
Skill path: .claude/skills/design-taste-frontend/ (instalado en proyecto)

### P16-C — Admin Nav + Estructura de Rutas
Skills: `admin-mobile-nav` — RECOMMENDED
Reason: Bottom tab bar con iOS safe-area es patrón específico con múltiples trampas (oclusión de contenido, env() CSS, tap targets). Custom skill previene los 5 anti-patterns más comunes.
Skill path: .claude/skills/project/admin-mobile-nav.md

### P16-D — Admin Agenda Mensual
Skills: `agenda-monthly-context` — RECOMMENDED
Reason: Tipos AgendaDay/AgendaSlot ya existen en types/index.ts. date-fns weekStartsOn:1 crítico para España. Componentes AgendaDayPanel/AgendaModal deben reutilizarse, no recrearse. Sin este context el subagente reinventa desde cero.
Skill path: .claude/skills/project/agenda-monthly-context.md

### P16-G — Admin Horarios Backend + Redesign
Skills: `horarios-backend-context` — BLOCKING
Reason: booking_settings es key-value store (no tabla nueva). supabaseAdmin vs createClient choice es crítica (RLS silencioso). ON CONFLICT DO NOTHING obligatorio. Sin este skill el subagente puede: crear tabla nueva, usar client incorrecto, duplicar slots.
Skill path: .claude/skills/project/horarios-backend-context.md

## Skills created this session
- .claude/skills/project/admin-mobile-nav.md (nueva — P16-C)
- .claude/skills/project/agenda-monthly-context.md (nueva — P16-D)
- .claude/skills/project/horarios-backend-context.md (nueva — P16-G)

## Detected gaps
- SKILL_REPO.md vacío en Backend/DB/Auth — skills custom creadas desde cero para este proyecto
- find-skills no instalado en este entorno — búsqueda externa no disponible

## Notes
- design-taste-frontend ya instalado en proyecto (POST-1 decision, SKILL_REPO.md)
- P16-A no necesita skill — dispatch prompt incluirá notas críticas de Tailwind v4
- Todos los subagentes POST-16 ejecutan en paralelo (cero archivos compartidos)
