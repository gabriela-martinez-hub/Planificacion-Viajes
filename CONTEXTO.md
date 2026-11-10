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

Datos, textos e infraestructura (2026-11-09, ver `HISTORIA.md`):
- Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para el
  cliente; `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_PROJECT_REF` sin prefijo
  `VITE_`, solo para scripts. Valores en `.env` (ignorado por git); plantilla en
  `.env.example`.
- Municipios: `supabase/seed/divipola.csv` (DIVIPOLA del DANE, 53 municipios) es
  la base del seed. Fuentes en `supabase/seed/FUENTES.md`.
- Ruta del café y ruta de termales: se arman con atracciones del seed, cada una
  con su fuente, porque no hay lista oficial. "Pueblos patrimonio" sigue con
  Salamina y Aguadas (`plan.md` sección 7).
- Textos: `t(clave, parametros)` desde `@/i18n`, con marcadores `{nombre}` y
  claves verificadas por TypeScript. Los textos nuevos se agregan en
  `src/i18n/es-CO.ts`.
- CI en GitHub Actions (lint, formato, pruebas y build) en cada push o pull
  request a `dev` y `main`. Consulta diaria a Supabase en lugar de semanal
  (`plan.md` fase 0).

## Decisiones reemplazadas
- Internacionalización con react-i18next: reemplazada por el archivo tipado
  `src/i18n/es-CO.ts` (2026-11-07, segunda ronda).
- Incluir en el MVP los municipios del Valle del Cauca del PCC: pasan a una
  versión posterior (2026-11-07, segunda ronda).
- Arrastrar y soltar con dnd-kit: reemplazado por botones "subir" y "bajar"
  (2026-11-07, cuarta ronda).
- Cola offline de check-ins: eliminada; el check-in requiere conexión
  (2026-11-07, cuarta ronda).
- Workflow semanal contra la pausa de Supabase: reemplazado por uno diario
  (2026-11-09).
- Rutas del café y de termales "verificadas con fuentes oficiales": se arman con
  atracciones del seed porque no existe lista oficial (2026-11-09).

## Estado actual
- Fase 0 en curso: 3/8 tareas hechas (T-01, T-02, T-04) y 2 en curso (T-24,
  T-26). Tablero: 4/29 tareas hechas (también T-06 de la fase a), 6 riesgos
  activos y 2 ideas.
- Criterios de la fase 0 cumplidos: la app arranca, los textos de la pantalla
  inicial salen de `src/i18n/es-CO.ts`, `.env.example` no tiene la clave
  secreta y la CI corre lint y tests (en verde en GitHub Actions). Falta: sesión
  con Google (T-03, T-05).
- Supabase creado (T-02). Claves en `.env` local. `supabase/migrations/` sigue
  vacío.
- CI y consulta diaria a Supabase en `.github/workflows/` (T-24). Push de `dev`
  hecho el 2026-11-09 y CI en verde. La consulta
  diaria se salta hasta que existan la variable `SUPABASE_URL` y el secreto
  `SUPABASE_ANON_KEY` en GitHub.
- Borrador de la política de datos en `docs/politica-tratamiento-datos.md`
  (T-26), con campos entre corchetes por completar.
- Trabajo en la rama `dev`, al día con `origin/dev`.
- Configuración de Claude Code integrada en `dev` (`68dff1d`); falta verificar
  que carga en una sesión de Claude Code (T-29).
- Entorno local: el Node global es v14. Hay que activar Node 22 con
  `nvm use 22` en una terminal con permisos de administrador, o anteponer
  `C:\Users\User\AppData\Roaming\nvm\v22.16.0` al PATH. Python 3.12 en
  `%LOCALAPPDATA%\Programs\Python\Python312`. En PowerShell 5.1,
  `tablero.py cambio` recibe cortado un JSON con espacios: pasarlo por una
  variable de entorno.

## Próximos pasos
1. Usuario: revocar el token de GitHub que estuvo en la URL del remoto.
2. T-03 (usuario): cliente OAuth en Google Cloud Console con la URI
   `https://<reference-id>.supabase.co/auth/v1/callback`, proveedor Google y
   Redirect URLs en Supabase, usuarios de prueba (incluidos los evaluadores).
3. T-05: inicio y cierre de sesión con Google (cuando T-03 esté lista).
4. T-07: migraciones del catálogo con RLS de solo lectura. Después, el usuario
   crea `SUPABASE_URL` y `SUPABASE_ANON_KEY` en GitHub para activar la consulta
   diaria.
5. T-26 (usuario): completar los campos de la política y aprobarla.
6. T-08: seed del catálogo a partir de `divipola.csv`.
7. T-29 (usuario): abrir Claude Code y ejecutar `/context all` y
   `/orquestador-proyecto retomar`.

## Pendientes de decisión del usuario
- Datos para la política de tratamiento de datos: responsables, universidad y
  programa, correo de contacto, región del proyecto en Supabase, proveedor de
  despliegue, qué pasa con los datos al terminar el curso y fecha de vigencia.
- Si se cambia `python3` por `python` en la skill para Windows y se arregla el
  paso del JSON en PowerShell, o se sigue invocando a mano.
- Sobre el diseño del producto no hay preguntas abiertas (`plan.md`, sección 10).
