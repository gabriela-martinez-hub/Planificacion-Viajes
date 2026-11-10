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
- Seed del catálogo (T-08, 2026-11-10): esquemas Zod en
  `src/domain/catalogo/esquemas.ts` (tipos de salida `z.infer` y de entrada
  `z.input`/`*Seed`); validación de referencias y conectividad del grafo en
  `src/domain/catalogo/validar.ts`; datos en `supabase/seed/datos/` (módulos TS
  tipados); carga con `scripts/cargar-seed.ts` (`npm run seed`, `seed:dry-run`),
  que lee el `.env` por sí mismo y usa la clave `service_role`. Pruebas en
  `src/domain/catalogo/seed.test.ts`. `clima_mensual` lo llena T-25.
- Ruta del café y ruta de termales: se arman con atracciones del seed, cada una
  con su fuente, porque no hay lista oficial. "Pueblos patrimonio" sigue con
  Salamina y Aguadas (`plan.md` sección 7).
- Textos: `t(clave, parametros)` desde `@/i18n`, con marcadores `{nombre}` y
  claves verificadas por TypeScript. Los textos nuevos se agregan en
  `src/i18n/es-CO.ts`.
- CI en GitHub Actions (lint, formato, pruebas y build) en cada push o pull
  request a `dev` y `main`. Consulta diaria a Supabase en lugar de semanal
  (`plan.md` fase 0).

Autenticación e infraestructura de cliente (2026-11-09, ver `HISTORIA.md`):
- Cliente único de Supabase en `src/services/supabase.ts` (clave anon, sesión
  persistente). Configuración validada con Zod en `src/lib/config.ts`: si falta
  una variable `VITE_`, lanza error al arrancar.
- Autenticación con Google en `src/features/auth/` (contexto, hook `useAuth`,
  `AuthProvider`, `BotonAuth`), montada en `main.tsx`. Login y logout
  verificados en el navegador.
- El redirect de OAuth usa `window.location.origin`; esa URL
  (`http://localhost:5173` en desarrollo) debe estar en las Redirect URLs de
  Supabase.
- Dependencias de runtime fijadas: `@supabase/supabase-js@2.45.4`, `zod@3.23.8`,
  `@tanstack/react-query@5.59.0`, `leaflet@1.9.4`, `react-leaflet@4.2.1`,
  `react-leaflet-cluster@2.1.0`.

Catálogo y exploración (2026-11-10, ver `HISTORIA.md`):
- El catálogo se lee de Supabase con TanStack Query (`QueryClient` en
  `src/app/query-client.ts`, provider en `main.tsx`). Servicio de lectura en
  `src/services/catalogo.ts` (clave anon, respuestas validadas con Zod); hooks
  en `src/features/catalogo/use-catalogo.ts`.
- Vista de exploración `src/features/catalogo/ExplorarCatalogo.tsx`: tres
  pestañas (Municipios | Atracciones | Mapa), buscador sin tildes, filtros por
  departamento y estilo, ficha de detalle `FichaAtraccion.tsx`. El mapa
  (`MapaCatalogo.tsx`) es Leaflet con los 53 municipios como marcadores
  agrupados, atribución OSM y zoom con rueda desactivado; se carga diferido
  (`React.lazy`) para no engordar el arranque. Lógica pura en `filtrar.ts` y
  `formato.ts` con pruebas. Es solo para explorar; la selección de destinos se
  hará en el planificador (T-13).
- Precio de atracciones: tarifa general de adulto (camino simple de `plan.md`
  6.2), con nota de que puede variar por edad. El modelo completo es la idea
  I-03.

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
- Política de tratamiento de datos: aprobada en versión académica (sin usuarios
  públicos; solo equipo y evaluadores). Si la app se abre al público se
  reemplaza por una política completa según la Ley 1581 de 2012 (2026-11-09).

## Estado actual
- **Fase 0 cerrada** (7/8 tareas; T-29 es una verificación opcional que el
  usuario pospuso). Los 5 criterios de aceptación están verificados.
- Tablero en revisión 17: 12/30 tareas hechas, 6 riesgos activos y 3 ideas. La
  fase (a) va 5/5 tareas, pero **sigue formalmente abierta** por un criterio de
  aceptación sin evidencia (ver abajo).
- **Catálogo completo y explorable:** el seed está en Supabase (T-08) y la vista
  lo lee con TanStack Query. Tres pestañas: Municipios, Atracciones y Mapa
  (Leaflet con los 53 municipios agrupados). El usuario verificó la vista y el
  mapa en el navegador.
- **Fase (a) casi cerrada (5/5 tareas).** Verificados 5 de 6 criterios: los 53
  en el mapa, Salamina y Aguadas como patrimonio, filtros en móvil, seed pasa
  Zod, grafo de buses conexo. Falta el criterio RLS "un INSERT con la clave
  pública sobre atracciones falla" (tarea T-30, paralelo).
- Autenticación con Google funcionando (T-03 del usuario + T-05 en código,
  commit 58eefab). El usuario probó login y logout en el navegador.
- Migración del catálogo en `supabase/migrations/20261109210000_catalogo.sql`
  (T-07, commit c48fe44), aplicada en el proyecto Supabase por el usuario.
- **Seed del catálogo cargado en Supabase (T-08, 2026-11-10):** el usuario
  ejecutó `npm run seed` sin error. En la base hay 3 departamentos, 53
  municipios (+ 53 cascos urbanos), 70 atracciones, 142 rutas de bus, 6 tarifas
  regionales, 3 rutas temáticas con ítems y 7 insignias. `clima_mensual` vacío
  (lo llena T-25). El seed pasa Zod y el grafo conecta los 53 municipios
  (0 aislados), verificado por `seed.test.ts` y `npm run seed:dry-run`.
- Supabase creado (T-02). Claves completas en `.env` local.
- CI en verde en GitHub Actions (T-24). La consulta diaria a Supabase se salta
  hasta que existan la variable `SUPABASE_URL` y el secreto `SUPABASE_ANON_KEY`
  en GitHub; su activación queda cubierta por T-23 antes de la sustentación.
- Política de datos aprobada en versión académica (T-26,
  `docs/politica-tratamiento-datos.md`).
- Dependencia nueva: `tsx@4.19.2` (devDependency) para ejecutar el script de
  carga del seed.
- Trabajo en la rama `dev`.
- Entorno local: hay `python`, `python3` y `py`; Node 22 activo en la sesión. No
  hay CLI de Supabase, psql ni docker, así que las migraciones las aplica el
  usuario. En PowerShell 5.1, `tablero.py cambio` recibe cortado un JSON con
  comillas: aplicar los cambios con un runner Python que llame a la función
  `cambio()` leyendo el JSON de un archivo.
- Archivos preexistentes con CRLF (`src/i18n/*.ts`, `src/index.css`,
  `src/test/setup.ts`) que `format:check` marca en local pero la CI en Ubuntu
  acepta. Los archivos nuevos del seed quedaron con LF. Mejora opcional
  pendiente: `.gitattributes` con `* text=auto eol=lf`.

## Próximos pasos
1. T-11: generador de itinerario (`plan.md` 6.1 pasos 1-7) con pruebas de los
   casos límite. Próxima tarea de la ruta crítica (P1). Depende de T-08 (hecha).
2. T-12: migraciones de datos de usuario (perfiles, viajes, etc.) con RLS.
   Depende de T-07 (hecha).
3. En paralelo, disponibles: T-17 (servicio Open-Meteo, depende de T-01),
   T-25 (script de clima mensual, depende de T-06) y T-30 (verificar el criterio
   RLS de la fase a).
4. Usuario (cuando quiera): crear la variable `SUPABASE_URL` y el secreto
   `SUPABASE_ANON_KEY` en GitHub para activar la consulta diaria contra la pausa.
5. Antes de la sustentación: revisar costos, tarifas y tiempos de bus del seed
   (marcados aproximados, R-04) y el acceso al Nevado del Ruiz (R-03).

## Pendientes de decisión del usuario
- Si se cambia `python3` por `python` en la skill para Windows y se automatiza
  el paso del JSON en PowerShell, o se sigue aplicando con un runner.
- Si se agrega un `.gitattributes` para normalizar los finales de línea a LF.
- Sobre el diseño del producto no hay preguntas abiertas (`plan.md`, sección 10).
