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
