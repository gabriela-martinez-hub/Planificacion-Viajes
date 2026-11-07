# Contexto del proyecto

> Foto actual del proyecto. La mantiene la skill `orquestador-proyecto`
> (`.claude/skills/orquestador-proyecto/`). El diseño completo está en `plan.md`.

## Objetivo
Aplicación web responsive (mobile-first, PWA) para planificar viajes por Caldas,
Quindío y Risaralda según fechas, presupuesto y clima, con insignias por lugares
visitados. Proyecto académico del curso de Sistemas Inteligentes.

## Decisiones vigentes
Fuente: `plan.md`, secciones 1.1 a 1.3 (rondas del 2026-11-07).

- Stack de la sección 3 de `plan.md`: React + TypeScript + Vite, Tailwind, React
  Router, TanStack Query, Zod, Supabase (Postgres, Auth, RLS), Leaflet con OSM,
  vite-plugin-pwa, Vitest y Playwright.
- Alcance geográfico del MVP: solo Caldas, Quindío y Risaralda (53 municipios).
- Itinerario: algoritmo determinista por reglas (TOPTW: voraz + búsqueda local),
  sin IA generativa.
- Transporte: bus intermunicipal con un grafo de rutas directas y Dijkstra.
- Punto de partida elegido por el usuario: municipio del catálogo o Bogotá,
  Medellín o Cali. El itinerario incluye el regreso y su costo.
- Autenticación con Google (Supabase Auth). Se puede explorar y generar un
  itinerario sin cuenta (guardado en IndexedDB).
- Uso académico, compatible con el plan gratuito de Open-Meteo y la política de
  teselas de OSM.
- Seed inicial de 40 a 60 atracciones, más una pseudoatracción "Casco urbano"
  por municipio.
- Idioma: español con textos centralizados en `src/i18n/es-CO.ts` y `Intl`.
- Ruta "Pueblos patrimonio" con Salamina y Aguadas.
- Una insignia especial es verificada si al menos el 80 % de sus componentes
  tienen check-in verificado. La insignia "Eje Cafetero" exige los 53 municipios.
- Reordenar ítems con botones "subir" y "bajar".
- El check-in requiere conexión; sin conexión solo se lee el itinerario.
- Un único flujo end-to-end en Playwright.

Herramientas de trabajo (2026-11-07, ver `HISTORIA.md`):
- La memoria y la gestión del proyecto se llevan con la skill
  `orquestador-proyecto` (RETOMAR al iniciar, CIERRE al terminar). El CIERRE
  revisa los criterios de aceptación de la fase antes de darla por terminada.
- Las pautas de `karpathy-guidelines` aplican en todas las sesiones mediante el
  import de `CLAUDE.md`.

## Decisiones reemplazadas
- Internacionalización con react-i18next: reemplazada por el archivo tipado
  `src/i18n/es-CO.ts` (2026-11-07, segunda ronda).
- Incluir en el MVP los municipios del Valle del Cauca del PCC: pasan a una
  versión posterior (2026-11-07, segunda ronda).
- Arrastrar y soltar con dnd-kit: reemplazado por botones "subir" y "bajar"
  (2026-11-07, cuarta ronda).
- Cola offline de check-ins: eliminada; el check-in requiere conexión
  (2026-11-07, cuarta ronda).

## Estado actual
- Plan aprobado (`plan.md`); no hay código de la aplicación todavía.
- Configuración de Claude Code lista y versionada en el commit `634ff88`:
  `CLAUDE.md`, `.claude/skills/orquestador-proyecto/` y
  `.claude/skills/karpathy-guidelines/`. Falta verificar que cargan en una
  sesión de Claude Code (T-29).
- Tablero inicial en `control/tablero.json`: 29 tareas (0 hechas), 6 riesgos
  activos y 2 ideas.
- Trabajo en la rama `docs/claude-skills`, sin publicar en el remoto.

## Próximos pasos
1. T-29: abrir una sesión de Claude Code, ejecutar `/context all` y
   `/orquestador-proyecto retomar` para confirmar que todo carga.
2. T-01: crear el proyecto Vite + React + TS con Tailwind, ESLint/Prettier y Vitest.
3. T-02: el usuario crea el proyecto en Supabase.
4. T-03: el usuario configura OAuth de Google en Google Cloud Console y Supabase.
5. T-04 y T-05: archivo de textos `es-CO.ts` e inicio de sesión con Google.
6. T-06: verificar el conteo de municipios con la DIVIPOLA (puede ir en paralelo).

## Pendientes de decisión del usuario
- Si la skill `orquestador-proyecto` debe usar un modelo fijo (campo `model`
  del frontmatter, por ejemplo `opus`) o el de la sesión.
- Cuándo integrar la rama `docs/claude-skills` en `dev`.
- Sobre el diseño del producto no hay preguntas abiertas (`plan.md`, sección 10).
