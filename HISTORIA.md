# Historia del proyecto

> Bitácora cronológica que mantiene la skill `orquestador-proyecto`. Solo se
> agregan entradas al final; nunca se edita ni se borra una entrada anterior.

### 2026-11-07 — Configuración de skills de Claude Code
- Cierre anterior: ninguno
- Commits: 634ff88 (plan del proyecto y skills de Claude Code)
- Qué se hizo:
  - Se creó la skill `orquestador-proyecto` (`.claude/skills/orquestador-proyecto/`), adaptada de una skill de ejemplo de otro proyecto, con su script `scripts/tablero.py` (mostrar, validar, render, cambio, servir).
  - Se creó el tablero inicial (`control/tablero.json`) a partir de `plan.md`: 7 frentes (fases 0, a-e y final) con sus criterios de aceptación, 28 tareas, 6 riesgos y 2 ideas. Se generaron `TABLERO.md`, `CONTEXTO.md` y este archivo.
  - Se integró la skill `karpathy-guidelines` copiada sin cambios de multica-ai/andrej-karpathy-skills (commit 2c60614, licencia MIT).
  - Se creó `CLAUDE.md`, que importa las pautas de Karpathy para que apliquen en todas las sesiones y define el flujo RETOMAR/CIERRE.
  - El usuario eliminó el `SKILL.md` de ejemplo de la raíz.
- Decisiones:
  - Usar la skill de orquestador en este proyecto, con el mismo objetivo que la de ejemplo (pedido del usuario).
  - Quitar el modo TRIAGE del ejemplo: dependía de un vault y de preguntas a desarrolladores que este proyecto no tiene. En su lugar, el CIERRE revisa los criterios de aceptación de la fase antes de darla por terminada (propuesta de Claude).
  - La skill no fija `model: opus`; queda a decisión del usuario (propuesta de Claude).
  - Integrar `karpathy-guidelines` como skill de proyecto, no como plugin global, para que quede versionada con el repositorio (pedido del usuario).
  - Importar las pautas desde `CLAUDE.md` para que apliquen siempre, sin duplicar el texto (pedido del usuario).
  - Separar en dos commits la configuración y la memoria del cierre (opción A, elegida por el usuario).
- Hallazgos:
  - Git no tenía identidad configurada; el usuario la configuró antes del primer commit.
  - No se verificó en una sesión de Claude Code que las skills y `CLAUDE.md` cargan; queda como tarea T-29.
- Criterios de aceptación: no se cerró ninguna fase.
- Cambios del tablero: creación del tablero inicial; nueva tarea T-29 (usuario, paralelo, P2).
- Origen: sesión de Kiro con el usuario

### 2026-11-09 — T-01: proyecto base
- Cierre anterior: 68dff1d (el cierre del 2026-11-07 entró en `dev` con squash en el PR #1)
- Commits: 2712f6f (proyecto base y arreglo de `tablero.py`)
- Qué se hizo:
  - T-01 terminada: proyecto Vite + React + TypeScript con Tailwind, ESLint/Prettier y Vitest + Testing Library en la raíz del repositorio, alias `@` hacia `src`, estructura de carpetas de `plan.md` sección 8 (con `.gitkeep`), `.nvmrc`, `.gitignore` ampliado y README con los comandos.
  - Pantalla inicial con textos tomados de `src/i18n/es-CO.ts` (versión mínima; la completa y `t(clave)` son T-04) y una prueba que lo comprueba.
  - Se instaló Python 3.12.10 con winget (alcance de usuario) para ejecutar el script del tablero.
  - `tablero.py` no corría en Windows porque importaba `fcntl`. Ahora lo importa solo si existe y, si no, bloquea creando el archivo `control/.tablero.lock` en modo exclusivo. La escritura atómica del JSON no cambió.
- Decisiones:
  - Versiones estables (Vite 5, React 18, TypeScript 5.5, Tailwind 3, ESLint 8, Vitest 1) en lugar de las de `create-vite@9.3.4` (Vite 8, TypeScript 7), que además generó una plantilla sin React. El proyecto se armó a mano (propuesta de Claude).
  - Node 22 fijado en `.nvmrc`; `create-vite` actual exige Node 20.19 o superior (propuesta de Claude).
  - No aplicar `npm audit fix --force`: obligaría a pasar a Vite 8 y Vitest 5 y las vulnerabilidades son solo de herramientas de desarrollo (propuesta de Claude).
  - Adaptar `tablero.py` a Windows en vez de editar el tablero a mano, para respetar la regla de la skill (pedido del usuario: instalar Python).
- Hallazgos:
  - El Node global es v14.21.3. nvm-windows tiene instaladas v20.11.1 y v22.16.0, pero `nvm use` requiere permisos de administrador; en la sesión se usó Node 22 anteponiendo su ruta al PATH.
  - `npm audit`: 11 vulnerabilidades (8 moderadas, 1 alta, 2 críticas) en esbuild/vite (servidor de desarrollo), minimatch (parser de ESLint) y tinypool (Vitest). Ninguna llega al bundle de producción.
  - Verificación de T-01: `npm run build` sin errores (CSS de Tailwind 5,33 kB, JS 143 kB), `npm run lint` con 0 avisos, `npm test` 1/1, servidor de desarrollo con HTTP 200.
  - La memoria anterior decía que el trabajo estaba en la rama `docs/claude-skills` sin publicar; ya estaba integrado en `dev` (68dff1d) y el hash 634ff88 no existe en `dev`.
- Criterios de aceptación: la fase 0 sigue abierta (1/8 tareas). Cumplido "La app arranca". Avance parcial en "Los textos de la pantalla inicial salen de src/i18n/es-CO.ts" (T-04 lo completa). Pendientes: inicio y cierre de sesión con Google (T-02, T-03, T-05), CI (T-24) y `.env.example` sin la clave secreta (T-02).
- Cambios del tablero: T-01 pasa a hecha. Sin tareas, riesgos, ideas ni prioridades nuevas.
- Origen: sesión de Kiro con el usuario
