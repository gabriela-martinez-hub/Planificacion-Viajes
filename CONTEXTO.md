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

Entorno y herramientas (2026-11-09, ver `HISTORIA.md`):
- Versiones estables: Vite 5, React 18, TypeScript 5.5, Tailwind 3, ESLint 8
  (`.eslintrc.cjs`) con Prettier, Vitest 1 con Testing Library y jsdom.
- Node 22 fijado en `.nvmrc`.
- No se aplica `npm audit fix --force` mientras las vulnerabilidades sean solo de
  herramientas de desarrollo.
- `tablero.py` funciona en Windows: usa `fcntl` si existe y, si no, un archivo de
  bloqueo exclusivo.
- La skill `orquestador-proyecto` usa siempre Claude Sonnet 5.5
  (`model: claude-sonnet-5-5` en su frontmatter), sin importar el modelo de la
  sesión (2026-11-09, pedido del usuario).

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
- Fase 0 en curso: 1/8 tareas. Tablero: 1/29 tareas hechas (T-01), 6 riesgos
  activos y 2 ideas.
- Proyecto base listo en la raíz (T-01): `npm run build`, `npm run lint` y
  `npm test` pasan, y `npm run dev` arranca. La pantalla inicial toma sus textos
  de `src/i18n/es-CO.ts` (versión mínima). Carpetas de `plan.md` sección 8 creadas
  y vacías (`.gitkeep`).
- Configuración de Claude Code (`CLAUDE.md` y las dos skills) integrada en `dev`
  con el commit `68dff1d` (PR #1). Falta verificar que carga en una sesión de
  Claude Code (T-29).
- Trabajo en la rama `dev`.
- Entorno local: el Node global es v14. Hay que activar Node 22 con
  `nvm use 22` en una terminal con permisos de administrador, o anteponer
  `C:\Users\User\AppData\Roaming\nvm\v22.16.0` al PATH. Python 3.12 instalado en
  `%LOCALAPPDATA%\Programs\Python\Python312` (en terminales nuevas queda en el
  PATH como `python`; el comando `python3` de la skill no existe en Windows).

## Próximos pasos
1. T-02 (usuario): crear el proyecto en Supabase y anotar la URL, la clave
   pública (anon) y la clave secreta (service_role).
2. T-03 (usuario): cliente OAuth en Google Cloud Console, proveedor Google y
   Redirect URLs en Supabase, usuarios de prueba.
3. T-04: archivo `es-CO.ts` completo y función `t(clave)`.
4. T-06: verificar el conteo de municipios con la DIVIPOLA (puede ir en paralelo).
5. T-05: inicio y cierre de sesión con Google, con `.env.example` sin secretos
   (cuando T-03 esté lista).
6. T-24: CI con lint y tests (necesita T-02 para el workflow semanal).
7. T-29 (usuario): abrir Claude Code y ejecutar `/context all` y
   `/orquestador-proyecto retomar`.

## Pendientes de decisión del usuario
- Si se cambia `python3` por `python` en la skill para Windows, o se deja como
  está y se invoca a mano.
- Sobre el diseño del producto no hay preguntas abiertas (`plan.md`, sección 10).
