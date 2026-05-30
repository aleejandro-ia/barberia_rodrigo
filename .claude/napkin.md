# Napkin — Barbería BG Barber
# Errores corregidos y patrones aprendidos en este proyecto
# Actualizado: 2026-05-30

## Errores y correcciones

1. **Leer antes de Edit siempre, incluso post-compactación**
   Tras compactación, Edit falla "File has not been read yet" aunque el contenido esté en el resumen.
   Fix: Read con limit:1 antes de cualquier Edit.

2. **Verificar qué ya está hecho antes de re-editar**
   Post-compactación, muchos cambios ya estaban aplicados. Leer el archivo antes de asumir que hay que cambiar. Evita "string not found" y edits duplicados.

3. **No commitear copy hasta que el usuario lo revise**
   Instrucción explícita del usuario. Cualquier cambio de contenido visible → esperar aprobación antes de commit/push.

4. **Vercel CLI no instalado — usar GitHub push**
   Deploy via `git push origin main` → GitHub → Vercel auto-deploy.
   Repo: aleejandro-ia/barberia_rodrigo, rama main.

5. **Force push requiere confirmación explícita**
   Auto mode bloquea `git push --force`. Esperar "sí, force push" explícito.

6. **Fuente weight 300 = pixelación en fondos oscuros**
   Outfit weight 300 pixelada en dark bg. Usar mínimo weight 400.
   Plus Jakarta Sans elegida — mejor hinting, sin pixelación.

7. **useState para valores continuos de animación = re-renders a 60fps**
   Para rotación de carousel, RAFs, posición de mouse: usar useRef + direct DOM style update.
   Nunca useState para valores que cambian por frame.

8. **window.addEventListener scroll = jank + activa en toda la página**
   Banido para cualquier componente en sección parcial de página.
   Alternativas: Motion useScroll, IntersectionObserver, pointer events, CSS scroll-driven.

9. **SSR + Math.cos/Math.sin con Math.PI = hydration mismatch**
   Node.js y V8 browser producen floats ligeramente distintos para trigonometría.
   Fix: `.toFixed(4)` + `parseFloat()` en los resultados antes de renderizar como atributos SVG.
   Afecta: AboutSection.tsx TICKS array (x1, y1, x2, y2). AÚN NO ARREGLADO.

10. **React state no sobrevive OAuth redirect (Google OAuth)**
    Google OAuth hace full-page redirect. Todo el state React se destruye.
    Fix: guardar en sessionStorage ANTES de `signInWithOAuth`. Restaurar en `onAuthStateChange` con event `SIGNED_IN`.
    Clave usada: 'bgbarber_pending_booking' = {date, slot}.

## Patrones del proyecto

1. **Paleta — NO CAMBIAR**
   #0E0B08 bg, #161310 cards, #C9A96E gold, #F2EDE7 warm white
   #7A7268 texto muted, #4A4540 labels muy muted
   Una sola paleta warm en todo el proyecto.

2. **Fuentes**
   var(--font-outfit) → Plus Jakarta Sans (nombre de variable heredado, no cambiar)
   var(--font-dancing) → Dancing Script (firma, Maestro Barbero)
   Base 17px. No usar weight 300.

3. **proxy.ts — NUNCA crear middleware.ts**
   Next.js 16 usa proxy.ts. Crear middleware.ts rompe el routing.

4. **Admin = alejandronopez@gmail.com hardcoded**
   isAdmin() en lib/auth.ts. No hay tabla admin_users.

5. **Imágenes = siempre placeholders, nunca externas**
   Usuario gestiona todas las imágenes desde admin panel.
   Placeholders: SVG gold + texto "Admin → Imágenes".

6. **Deploy = git push origin main**
   GitHub conectado a Vercel. No CLI.

7. **Tailwind v4 — sintaxis diferente**
   No usar tailwindcss plugin en postcss.config.js. Usar @tailwindcss/postcss.
   Custom theme en globals.css con @theme inline { ... }.

8. **Infinite marquee carousel — patrón correcto**
   posRef (useRef, px) — nunca useState.
   RAF loop: posRef -= AUTO_SPEED cada frame.
   Triple array para contenido continuo.
   Seamless reset: if posRef <= -totalW → posRef += totalW.
   Drag: pointer events, velRef para inercia, FRICTION decay.

9. **Booking step machine**
   Steps: 'date' → 'slot' → 'form' → 'confirmed' | 'blocked'
   onAuthStateChange SIGNED_IN event = momento de restaurar sessionStorage pending.
   SLOT_TAKEN error → slotRefreshKey++ → TimeSlotPicker re-fetch automático.
   Active booking check: query Supabase en setup, resultado → step 'blocked'.

10. **forge:sync — ejecutar al final de cada sesión o fase significativa**
    No esperar al límite de contexto. Actualizar PROGRESS.md + AGENTS.md + napkin.md + DECISIONS.md.
    El usuario espera que ocurra automáticamente antes de cada commit/push.
