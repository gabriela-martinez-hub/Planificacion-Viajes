---
name: orquestador-proyecto
description: Mantiene la memoria del proyecto Planificador de viajes del Eje Cafetero y actúa como su gestor (tablero de prioridades, dependencias, bloqueos y riesgos por fase del plan). Usar al cerrar una fase o sesión (registra historia, actualiza contexto y tablero), al iniciar una sesión nueva (resume dónde vamos y qué sigue), cuando el usuario pida ver el estado u ordenar prioridades, y cuando comparta decisiones tomadas fuera de Claude Code.
when_to_use: Frases como "cerremos la sesión", "terminamos la fase", "¿dónde íbamos?", "retomemos", "¿cómo va el proyecto?", "muéstrame el tablero", "ordena las prioridades", "decidimos con el profesor que...".
argument-hint: "[cierre | retomar | tablero | priorizar]"
allowed-tools: Read Grep Glob Bash(python3 .claude/skills/orquestador-proyecto/scripts/tablero.py *) Bash(git log *) Bash(git status *) Bash(git show *) Bash(git diff *)
---

# Orquestador del proyecto

Proyecto: aplicación web (PWA) para planificar viajes por Caldas, Quindío y
Risaralda. El diseño aprobado está en `plan.md`; las fases son las de su
sección 9: Fase 0 (preparación), (a) catálogo + mapa, (b) planificador de
itinerarios, (c) presupuesto, (d) clima, (e) insignias y perfil, y fase final
(pulido).

Esta skill NO implementa fases, NO modifica código (`src/`, `supabase/`,
`scripts/`) y NO edita `plan.md`. Solo registra, resume y propone. Si una
decisión nueva contradice `plan.md`, avísalo y propón al usuario el cambio
concreto (sección y texto); lo aplica una sesión de trabajo normal, no esta skill.

Si el usuario pasó un argumento (`$ARGUMENTS`), úsalo para elegir el modo. Si no,
elige el modo según lo que pidió; si no está claro, pregunta.

## Comando del tablero
Todos los comandos se ejecutan desde la raíz del repositorio:

```
python3 .claude/skills/orquestador-proyecto/scripts/tablero.py <comando>
```

- `mostrar`: resumen en texto (avance por frente, ruta crítica, bloqueos,
  riesgos, ideas y alertas).
- `validar`: revisa valores, orden y ciclos de dependencias.
- `render`: regenera `TABLERO.md`.
- `cambio '<json>'`: aplica operaciones y las registra en el historial. Con
  `"por":"claude"` siempre. Operaciones: `tarea_agregar`, `riesgo_agregar`,
  `idea_agregar`, `campo` (para T-, R- e I-), `mover` (posición dentro del
  grupo) y `nota`. El formato completo está en la ayuda del script (`ayuda`).
  Evita el apóstrofo (`'`) dentro de los textos del JSON, porque rompe las
  comillas del comando.
- `servir`: interfaz web local para el usuario (http://127.0.0.1:8765). La
  ejecuta el usuario en su terminal; tú no la arrancas.

Ejemplo:
```
python3 .claude/skills/orquestador-proyecto/scripts/tablero.py cambio '{"por":"claude","ops":[{"op":"campo","id":"T-01","campo":"estado","valor":"hecha"},{"op":"mover","id":"T-06","posicion":2}]}'
```

## Archivos que mantiene
- `control/tablero.json`: el tablero y su fuente de verdad. Frentes (uno por
  fase del plan, con sus criterios de aceptación copiados de `plan.md`), tareas
  (id T-nn, frente, grupo `ruta_critica` o `paralelo`, orden, responsable
  `usuario`, `claude` o `externo`, prioridad P1 a P4, dependencias, estado
  `pendiente`, `en_curso`, `bloqueada`, `hecha` o `descartada`, y
  `bloqueado_por` cuando está bloqueada), riesgos, ideas y un historial que
  NUNCA se borra. El usuario lo edita con la interfaz (`servir`); el orquestador
  lo edita solo con el comando `cambio`, nunca a mano, para que cada cambio quede
  en el historial. Las tareas no se eliminan: se marcan como descartadas.
- `TABLERO.md`: vista legible generada con `render`. No se edita a mano.
- `CONTEXTO.md`: foto actual del proyecto. Se reescribe para estar siempre al
  día. Secciones: Objetivo, Decisiones vigentes, Decisiones reemplazadas,
  Estado actual, Próximos pasos, Pendientes de decisión del usuario.
- `HISTORIA.md`: bitácora cronológica. SOLO se agregan entradas al final; nunca
  se edita ni se borra una entrada anterior.

## Modo CIERRE (al terminar una fase o sesión)
1. Pregunta al usuario: "¿Hubo decisiones o cambios acordados fuera de esta
   sesión (por ejemplo, con el profesor o el equipo) que deba registrar?"
   Espera su respuesta. Si pega texto, inclúyelo.
2. Revisa `git log` desde el commit del cierre anterior
   (`git log --grep "memoria: cierre" -1`) y `git diff --stat` de ese rango.
   Revisa también los resultados que haya dejado la sesión: informe de
   evaluación del generador (fase b), conteos verificados (DIVIPOLA), salida de
   las pruebas que el usuario o la sesión hayan corrido.
3. Si en la sesión se terminó una fase, revisa uno por uno sus criterios de
   aceptación (`frentes[].aceptacion` en el tablero, que reflejan `plan.md`
   sección 9). Para cada uno indica si está verificado y con qué evidencia
   (commit, prueba, cifra). Una fase solo se da por terminada si todos los
   criterios están verificados; si falta alguno, créalo como tarea y la fase
   sigue abierta.
4. Agrega una entrada al final de `HISTORIA.md` con este formato:
   ```
   ### <AAAA-MM-DD> — <Fase o tema>
   - Cierre anterior: <hash del commit del cierre anterior ("memoria: cierre de ...")>
   - Commits: <hashes>
   - Qué se hizo: <resumen breve>
   - Decisiones: <cada una con su razón>
   - Hallazgos: <datos relevantes, cifras>
   - Criterios de aceptación: <verificados y pendientes, si se cerró una fase>
   - Cambios del tablero: <prioridades, bloqueos y riesgos nuevos o cambiados>
   - Origen: sesión de Claude Code | conversación externa con el usuario
   ```
5. Actualiza el tablero con `cambio`: marca como hecho lo terminado, agrega las
   tareas, riesgos e ideas nuevos y reordena la ruta crítica (ver Modo
   PRIORIZAR). Respeta lo que el usuario marcó en la interfaz (en el historial,
   los cambios con `"por":"usuario"`). Después ejecuta `validar` y `render`, y
   actualiza `CONTEXTO.md`:
   - Agrega las decisiones nuevas a "Decisiones vigentes".
   - Si una decisión nueva reemplaza otra, mueve la anterior a "Decisiones
     reemplazadas" indicando qué la reemplazó y en qué fecha.
   - Reescribe "Estado actual" y "Próximos pasos" (pasos concretos, en orden).
   - Lista en "Pendientes de decisión del usuario" lo que esté abierto.
   - Si alguna decisión obliga a cambiar `plan.md`, anótalo como pendiente.
6. Muestra al usuario los archivos que vas a incluir (`git status`) y, con su
   confirmación, haz commit solo de `HISTORIA.md`, `CONTEXTO.md`, `TABLERO.md`
   y `control/tablero.json` con el mensaje "memoria: cierre de <fase o tema>".
7. Muestra al usuario los próximos pasos y los pendientes de decisión.

## Modo RETOMAR (al iniciar una sesión)
1. Lee `CONTEXTO.md`, las últimas 3 entradas de `HISTORIA.md` y `git log`
   reciente. Revisa en qué rama estás.
2. Verifica que el estado descrito coincide con el repositorio (por ejemplo,
   que los commits y archivos mencionados existen). Si algo no cuadra, avísalo.
3. Ejecuta `mostrar` y verifica que el tablero no contradice el repositorio
   (tareas marcadas hechas cuyo código o archivos no existen, o al revés). Lo
   que el usuario marcó en la interfaz manda sobre lo que tú creas.
4. Muestra al usuario, en este orden: dónde vamos (fase actual y avance del
   tablero), qué decisiones están pendientes, qué está bloqueado y por quién, y
   cuál es el siguiente paso recomendado según la ruta crítica.
5. No ejecutes nada hasta que el usuario confirme.

## Modo TABLERO (ver el estado del proyecto)
1. Ejecuta `mostrar` y contrasta con lo real: commits recientes, archivos que
   existen en el repositorio (por ejemplo, `supabase/migrations/`,
   `supabase/seed/`, `src/domain/`) y pruebas presentes.
2. Muestra: avance por fase, ruta crítica con la próxima tarea, qué está
   bloqueado y por quién, riesgos activos, alertas del script (tareas vencidas,
   sin responsable, en curso con dependencias abiertas) y criterios de
   aceptación pendientes de la fase en curso.
3. Si el tablero no coincide con el repositorio, avísalo y propón la corrección
   como operaciones `cambio`; aplícalas solo si el usuario confirma.

## Modo PRIORIZAR (ordenar prioridades)
Se usa cuando el usuario pide ordenar, cuando entran tareas nuevas y en cada
CIERRE.
1. Reúne las tareas abiertas: las del tablero, los próximos pasos de
   `CONTEXTO.md` y lo que el usuario acaba de pedir.
2. Asigna prioridad: P1 si bloquea otras tareas o evita rehacer trabajo; P2 si
   es lo siguiente en el flujo; P3 si aporta valor pero puede esperar; P4 si es
   una idea sin evaluar. Ante empate, primero la que desbloquea más tareas y
   luego la de menor esfuerzo.
3. Revisa las dependencias: ninguna tarea va antes de las que dependen de ella
   (el script avisa si pasa en la ruta crítica y rechaza los ciclos). Detecta
   tareas que esperan al usuario o a un externo (por ejemplo, la cuenta de
   Supabase o la configuración de Google Cloud) sin que nadie se lo haya pedido.
4. Aplica el nuevo orden con operaciones `mover` y `campo`. Las ideas nuevas
   van a la lista de ideas (`idea_agregar`), no a la ruta crítica. Lo que
   `plan.md` deja fuera del MVP (sección 2.2) o para una versión posterior
   (sección 2.3) va como idea, nunca como tarea.
5. Muestra el orden propuesto y los cambios respecto al anterior. No cambies
   prioridades que el usuario fijó sin decírselo.

## Reglas
- El tablero registra y propone; quien decide el orden final es el usuario.
- Nunca borres tareas ni historial del tablero: descarta la tarea (estado
  `descartada`) y deja que el historial lo registre.
- No edites `control/tablero.json` a mano, aunque la interfaz esté cerrada: usa
  `cambio`, que escribe de forma atómica y registra quién cambió qué.
- Cada cambio de prioridad, bloqueo o riesgo nuevo deja una línea en
  `HISTORIA.md` en el siguiente cierre.
- Nunca inventes decisiones: solo registra lo que está en commits, en
  `plan.md`, en resultados de la sesión o lo que el usuario dijo.
- Si algo no está claro, pregúntalo en vez de suponerlo.
- Cada entrada nueva de `HISTORIA.md` registra el hash del commit del cierre
  anterior (búscalo con `git log --grep "memoria: cierre"`). En la primera
  entrada de cierre, escribe "ninguno".
- Fechas en formato AAAA-MM-DD, zona horaria America/Bogota.
