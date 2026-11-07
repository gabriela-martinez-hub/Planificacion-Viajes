# Planificador de viajes del Eje Cafetero

PWA para planificar viajes por Caldas, Quindío y Risaralda. Proyecto académico
del curso de Sistemas Inteligentes.

## Dónde está cada cosa
- `plan.md`: diseño aprobado (alcance, stack, modelo de datos, lógica y fases con
  criterios de aceptación). Léelo antes de implementar algo de una fase; no lo
  cambies sin que el usuario lo apruebe.
- `CONTEXTO.md`: estado actual y decisiones vigentes.
- `control/tablero.json` y `TABLERO.md`: tareas, prioridades y riesgos. Se
  modifican solo con la skill `orquestador-proyecto`.

## Flujo de trabajo
- Al iniciar una sesión, usa la skill `orquestador-proyecto` en modo RETOMAR.
- Al terminar una fase o sesión, úsala en modo CIERRE.
- Interfaz y textos en español (es-CO).

## Pautas para escribir código
Estas pautas aplican en todas las sesiones, no solo cuando se activa la skill
`karpathy-guidelines`:

@.claude/skills/karpathy-guidelines/SKILL.md
