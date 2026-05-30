# FORGE — Cosas a Mejorar
# Feedback acumulado de proyectos reales
# Actualizar cada vez que se pida análisis del framework

---

## Sesión 1 — Proyecto Barbería BG Barber (2026-05-30)

### ✅ Lo que funcionó
- Discovery + plan: descomposición en fases clara, contratos API antes de código, DATA_MODEL evitó ambigüedades
- Dispatch con subagentes: file ownership respetado, build limpio al final
- CONTRACTS.md + DATA_MODEL.md: evitaron inconsistencias front/back

### ❌ Problemas detectados

**1. forge:sync no se ejecuta automáticamente**
El agente lo omite bajo presión de entregar código. Sin fricción forzada, sync siempre pierde frente a "seguir codificando".
→ Mejora: hook post-fase en forge:dispatch que bloquee avanzar hasta que forge:sync confirme. O trigger automático cada N turnos.

**2. napkin.md no existía al empezar**
Mismos errores repetidos en la misma sesión (ej: "leer antes de Edit"). Sin napkin desde el inicio, no hay memoria de correcciones.
→ Mejora: forge:kickoff debe crear napkin.md vacío como parte del setup. Obligatorio desde fase 0.

**3. Compactación rompe continuidad de obligaciones**
Tras compactación de contexto, el agente pierde el hilo de obligaciones continuas (sync automático, napkin update, skills activas).
→ Mejora: forge:sync debería incluir un bloque "OBLIGACIONES ACTIVAS" que se re-inyecte al resumir sesión. El SessionStart hook debería leer ese bloque.

**4. Trabajo post-launch fuera del PLAN.md**
Fases POST-1 a POST-5 (rediseño, copy, tipografía) solo en PROGRESS.md, no en PLAN.md. Plan original terminaba en Phase 6 y no se actualizó.
→ Mejora: cuando el usuario pide trabajo fuera del plan original, forge:plan debe abrir un "mini-plan" o addendum antes de ejecutar. No dejar fases huérfanas solo en PROGRESS.md.

**5. forge:selector saltado en trabajo post-launch**
Skills elegidas por conocimiento del agente, sin pasar por selector formal. SKILL_SELECTION.md desactualizado.
→ Mejora: cualquier fase nueva (incluido post-launch) debe pasar por selector aunque sea rápido. Selector debería tener modo "quick" para tareas pequeñas.

**6. PROGRESS.md desactualizado durante días**
Fecha 2026-05-29 mientras se trabajaba 2026-05-30. Sin sync automático, el archivo queda obsoleto.
→ Mejora: PROGRESS.md debería incluir "última vez verificado" separado de "última vez actualizado".

### 📊 Puntuación componentes
| Componente | Nota |
|---|---|
| Planning (discovery + plan) | 8/10 |
| Execution (dispatch) | 7/10 |
| Sync / memoria viva | 3/10 |
| Skill selection | 4/10 |
| Napkin discipline | 2/10 |
| **Global** | **5/10** |

### 💡 Mejora más impactante
Hook post-fase en forge:dispatch que bloquee avanzar hasta que forge:sync confirme. Sin esa fricción, el sync siempre pierde.

---
<!-- Añadir nuevas sesiones debajo de esta línea -->
