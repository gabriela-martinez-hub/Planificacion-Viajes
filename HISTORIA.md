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

### 2026-11-09 — Fase 0: Supabase, textos, CI y política de datos; T-06
- Cierre anterior: c96a82c
- Commits: e072dc5, c337e06, cc24035, 6a768cf, 977c4c9, c3b83a4, 87b272f, a23f61d, cb0aecd
- Qué se hizo:
  - T-02 terminada: el usuario creó el proyecto en Supabase. `.env.example` sin valores (c337e06) y `.env` local ignorado por git, con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (sin prefijo `VITE_`) y `SUPABASE_PROJECT_REF`.
  - T-06 terminada: `supabase/seed/divipola.csv` con los 53 municipios (código DANE y coordenadas de la cabecera) y `supabase/seed/FUENTES.md` con las fuentes.
  - T-04 terminada: `src/i18n/es-CO.ts` con los textos de todas las fases y `t(clave, parametros)` en `src/i18n/index.ts`. TypeScript rechaza claves inexistentes y parámetros faltantes o sobrantes; `esClave()` valida las claves que llegan de la base. La pantalla inicial usa `t()`.
  - T-24 en curso: `.github/workflows/ci.yml` (lint, formato, pruebas y build con Node 22) y `.github/workflows/supabase-actividad.yml` (consulta diaria a `departamentos` con la clave pública; se salta mientras no exista la variable `SUPABASE_URL`). Push de `dev` hecho por el usuario.
  - T-26 en curso: borrador de `docs/politica-tratamiento-datos.md` (Ley 1581 de 2012 y Decreto 1377 de 2013).
  - `plan.md` actualizado en la sección 7 (rutas temáticas), la sección 8 y la fase 0 (consulta diaria).
- Decisiones:
  - Ruta del café: se arma con atracciones cafeteras del seed, no con los municipios del PCC, porque no hay lista oficial y los 40 municipios del PCC se cruzan con la insignia "Eje Cafetero" (pedido del usuario, a propuesta de Claude).
  - Ruta de termales: se arma con las atracciones termales del seed, cada una con su fuente (pedido del usuario).
  - Consulta a Supabase diaria en lugar de semanal: la documentación de Supabase pide algunas consultas al día durante la semana (propuesta de Claude, aprobada por el usuario).
  - La clave `service_role` no lleva prefijo `VITE_` para que no entre al bundle (`plan.md` 5.3).
- Hallazgos:
  - DIVIPOLA (datos.gov.co, conjunto `gdxc-w37w`, actualizado el 2025-01-24): Caldas 27, Quindío 12, Risaralda 14. Coincide con el plan.
  - La Red Turística de Pueblos Patrimonio tiene 18 pueblos; de los tres departamentos solo Salamina y Aguadas.
  - El sitio oficial del PCC dice 51 municipios, pero publica 50 mapas (40 en los tres departamentos y 10 en el Valle).
  - El remoto `origin` tenía un token personal de GitHub en la URL; el usuario lo quitó. Falta confirmar que revocó el token.
  - En PowerShell 5.1, `tablero.py cambio '<json>'` recibe el JSON cortado si tiene espacios; en la sesión se pasó por una variable de entorno.
  - El repositorio es privado y no hay `gh` instalado: no se pudo ver desde la sesión si la CI pasó en GitHub.
  - El bundle JS pasó de 143 kB a 147,66 kB por los textos.
- Criterios de aceptación: la fase 0 sigue abierta (3/8 tareas hechas y 2 en curso). Cumplidos: "La app arranca", "Los textos de la pantalla inicial salen de src/i18n/es-CO.ts" (T-04, prueba en `src/App.test.tsx`) y ".env.example no contiene la clave secreta" (c337e06). Pendientes: inicio y cierre de sesión con Google (T-03, T-05). "CI corre lint y tests" quedó verificado: el usuario confirmó la ejecución en verde en GitHub Actions.
- Cambios del tablero: T-02, T-04 y T-06 pasan a hechas; T-24 y T-26 pasan a en curso; T-24 cambia "semanal" por "diario" en su título y R-01 en su mitigación; nota en T-08 sobre las rutas del café y termales. Sin tareas, riesgos, ideas ni prioridades nuevas.
- Origen: sesión de Kiro con el usuario

### 2026-11-09 — T-03, T-05 y T-07: autenticación con Google y migración del catálogo
- Cierre anterior: f943ba2
- Commits: 7fd2e43, c48fe44, 7569b53 (previos a la sesión), 58eefab (T-05)
- Qué se hizo:
  - T-03 terminada: el usuario configuró Google Cloud (pantalla de consentimiento en modo Testing, credenciales OAuth de aplicación web, usuarios de prueba) y, en Supabase, el proveedor Google y las Redirect URLs.
  - T-05 terminada (commit 58eefab): cliente único de Supabase con la clave anon (`src/services/supabase.ts`), configuración validada con Zod que detiene el arranque si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` (`src/lib/config.ts`), contexto de sesión (`src/features/auth/auth-context.ts`, `use-auth.ts`, `AuthProvider.tsx`) y `BotonAuth` con los textos de `auth.*` del i18n. Montado en `main.tsx` y usado en `App.tsx`. El usuario verificó en el navegador el inicio y cierre de sesión con Google reales.
  - T-07 reconciliada: la migración del catálogo (`supabase/migrations/20261109210000_catalogo.sql`, commit c48fe44 de una sesión anterior) ya estaba en el repo pero el tablero la tenía como pendiente. Revisada: todas las tablas de plan.md 5.1 con RLS de solo lectura (5.3), política única `FOR SELECT` y `revoke` de insert/update/delete/truncate a `anon` y `authenticated`. Queda como tarea del usuario aplicarla en el proyecto Supabase.
  - Dependencias nuevas (pinned): `@supabase/supabase-js@2.45.4` y `zod@3.23.8`.
- Decisiones:
  - El redirect de OAuth usa `window.location.origin` (en desarrollo, `http://localhost:5173`), por lo que esa URL debe estar en las Redirect URLs de Supabase (propuesta de Claude).
  - La configuración del cliente se valida con Zod y lanza error explícito si falta una variable, en lugar de fallar de forma confusa más adelante (propuesta de Claude, coherente con el principio de validación del plan).
  - El contexto, el hook y el provider de auth se separaron en archivos distintos para no disparar el aviso de `react-refresh/only-export-components` (propuesta de Claude).
  - T-24 se da por hecha: la CI está en verde y la consulta diaria a Supabase se salta sola hasta que exista la variable `SUPABASE_URL` en GitHub; su activación queda cubierta por T-23 antes de la sustentación.
- Hallazgos:
  - No hay CLI de Supabase, psql, docker ni parser de Postgres en el entorno local, así que la migración de T-07 no se pudo aplicar ni validar ejecutándola; queda como tarea del usuario (SQL Editor o `supabase db push`).
  - El entorno del agente bloquea arrancar el servidor de desarrollo; la prueba visual del login la hizo el usuario. El `vite build` sí carga el `.env` y confirmó que la configuración valida los valores reales sin lanzar error.
  - Los archivos preexistentes `src/i18n/es-CO.ts`, `src/i18n/index.ts`, `src/index.css` y `src/test/setup.ts` tienen CRLF en la copia de trabajo (Windows + `core.autocrlf=true`) y `format:check` los marca en local, pero la CI en Ubuntu los ve con LF y pasa. No hay `.gitattributes`. Queda como mejora opcional (un `.gitattributes` con `* text=auto eol=lf`), no abordada para no mezclarla con estas tareas.
  - El bundle JS pasó de 147 kB a ~313 kB (91 kB gzip) por incluir el cliente de Supabase.
  - PowerShell 5.1 corta el JSON con comillas al pasarlo como argumento a `tablero.py cambio`; el cambio se aplicó con un runner Python temporal que invoca la función oficial `cambio()` leyendo el JSON de un archivo (ya borrado).
- Criterios de aceptación: **Fase 0 cerrada (7/8 tareas; T-29 es verificación opcional que el usuario pospuso).** Los 5 criterios están verificados: "La app arranca" (T-01), "Se puede iniciar y cerrar sesión con Google" (T-05, verificado por el usuario en el navegador), "CI corre lint y tests" (T-24, en verde), "Los textos de la pantalla inicial salen de src/i18n/es-CO.ts" (T-04, prueba en App.test.tsx) y ".env.example no contiene la clave secreta" (c337e06).
- Cambios del tablero: T-03, T-05 y T-07 pasan a hechas; T-24 pasa de en_curso a hecha. Revisión 10. Sin tareas, riesgos ni ideas nuevos. La próxima tarea de la ruta crítica es T-08 (seed del catálogo).
- Origen: sesión de Kiro con el usuario

#### Actualización 2026-11-09 (misma sesión)
- El usuario aplicó la migración del catálogo (T-07) en el proyecto Supabase. T-07 queda completa: código en el repo (c48fe44) y esquema con RLS aplicado en la base. Deja de ser una tarea pendiente del usuario.

### 2026-11-10 — T-08: seed del catálogo (esquemas Zod, datos y carga)
- Cierre anterior: 552de13 (memoria: cierre de fase 0)
- Commits: (pendiente de este cierre)
- Qué se hizo:
  - T-08 terminada. Esquemas Zod del catálogo en `src/domain/catalogo/esquemas.ts`,
    reflejando el SQL de la migración T-07. Tipos de salida (`z.infer`) y de entrada
    (`z.input`, sufijo `*Seed`) para que el seed pueda omitir los campos con valor
    por defecto.
  - `src/domain/catalogo/validar.ts`: integridad referencial (claves foráneas,
    unicidades, un casco por municipio, 12 meses de clima por municipio) y
    `analizarConectividadBus` (componente conexa del grafo de buses entre
    municipios). Son funciones puras.
  - Datos del seed en `supabase/seed/datos/` como módulos TS tipados: 3
    departamentos, 53 municipios (desde `divipola.csv`, con su casco urbano),
    70 atracciones (53 cascos + 17 reales con fuente y fecha), 142 rutas de bus
    (71 corredores en ambos sentidos), 6 tarifas regionales, 3 rutas temáticas
    (café, termales, pueblos patrimonio) con sus ítems, 7 insignias
    (3 departamento + 1 eje + 3 ruta). `clima_mensual` vacío (lo llena T-25).
  - `scripts/cargar-seed.ts`: construye y valida el seed (Zod + referencias +
    conectividad) y carga en Supabase con la clave `service_role` leyendo el
    `.env` por sí mismo (cargador propio, sin dependencias). Carga idempotente con
    upsert, en orden de dependencias (nodos antes que municipios y externos).
    Modos `npm run seed` y `npm run seed:dry-run`.
  - Dependencia nueva (pinned): `tsx@4.19.2` para ejecutar el script.
  - Pruebas en `src/domain/catalogo/seed.test.ts` (8): 53 municipios (27/12/14),
    Salamina y Aguadas como patrimonio y ningún otro, un casco por municipio,
    integridad referencial sin problemas, 0 municipios aislados en el grafo, todo
    costo con fecha y fuente, rutas temáticas y sus ítems.
  - Se añadieron a `src/i18n/es-CO.ts` las claves de las insignias de ruta
    (`insignias.rutaPueblosPatrimonio`, `rutaCafe`, `rutaTermales`).
  - `tsconfig.node.json` ahora incluye `scripts` para que `tsc -b` y la CI
    verifiquen el script de carga. `format` y `format:check` se ampliaron a
    `{src,scripts,supabase/seed}`.
- Decisiones:
  - El clima mensual NO se genera en T-08: es tarea de T-25 (script reanudable que
    respeta la cuota de Open-Meteo). Inventar promedios sin fuente contradiría el
    principio de datos verificables del plan.
  - Las 17 atracciones reales se concentran en los municipios turísticos; los demás
    quedan representados por su casco urbano, de modo que los 53 aparecen en el mapa
    sin inventar atracciones sin fuente (propuesta de Claude, coherente con R-04).
  - Los archivos del seed usan rutas relativas a `src/domain/catalogo/esquemas` en
    vez del alias `@`, porque viven fuera de `src` y los consume también `tsx`.
  - El script carga el `.env` con un lector propio: `tsx` no lo hace solo. Las
    variables del entorno real ganan sobre las del archivo (útil en CI).
  - Costos, tarifas y tiempos de bus marcados `costo_aproximado = true` (R-04); el
    PNN Los Nevados queda `restringida` y `requiere_guia` (R-03).
- Hallazgos:
  - Palestina (Caldas) quedaba aislada en el primer diseño del grafo; se agregó el
    corredor Chinchiná–Palestina–Manizales. Ahora los 53 están en una sola
    componente conexa.
  - El tipo `z.infer` del esquema (salida) exige los campos con default; el seed
    debe tiparse con `z.input` (entrada) para poder omitirlos. `catalogoSchema.parse`
    aplica los defaults al construir.
  - El usuario ejecutó `npm run seed` y cargó los datos en Supabase sin error
    (conteos esperados por tabla), tras arreglar la carga del `.env`.
  - Persiste el aviso de CRLF en `src/i18n/*` y `src/index.css`/`src/test/setup.ts`
    en `format:check` local (Windows); la CI en Ubuntu los ve con LF y pasa. Los
    archivos nuevos del seed quedaron con LF y no aparecen en el aviso. Mejora
    opcional aún pendiente: un `.gitattributes` con `* text=auto eol=lf`.
- Criterios de aceptación (F-a sigue abierta, 3/5 tareas):
  - "El seed pasa la validación Zod": **verificado** (prueba `seed.test.ts` y
    `npm run seed:dry-run`).
  - "El grafo de buses conecta todos los municipios... y los que no, quedan
    listados": **verificado** (0 aislados; `analizarConectividadBus` y prueba).
  - "Salamina y Aguadas como pueblos patrimonio": verificado en datos; mostrarlo es
    T-09.
  - "Los 53 municipios aparecen en el mapa": datos listos; el mapa es T-10.
  - "Los filtros funcionan en móvil": T-09.
  - "Un INSERT con la clave pública sobre atracciones falla": pendiente (RLS; se
    prueba desde el SQL Editor con la anon key o con la UI de T-09/T-10).
- Cambios del tablero: T-08 pasa a hecha. Revisión 13. Sin tareas, riesgos ni
  ideas nuevos. La próxima tarea de la ruta crítica es T-09 (lista filtrable y
  ficha de atracción).
- Origen: sesión de Kiro con el usuario

### 2026-11-10 — T-09: explorar el catálogo (lista filtrable y ficha)
- Cierre anterior: 4aca043 (memoria: cierre de T-08)
- Commits: (se hará junto con T-10, según acuerdo con el usuario: dos commits al
  cerrar T-10, uno de código y otro de memoria, que cubren T-09 y T-10)
- Qué se hizo:
  - T-09 terminada. Lectura del catálogo desde Supabase con TanStack Query:
    dependencia `@tanstack/react-query@5.59.0`, `QueryClient` en
    `src/app/query-client.ts` (caché larga porque el catálogo es de solo
    lectura), `QueryClientProvider` en `main.tsx`.
  - `src/services/catalogo.ts`: lee departamentos, municipios (join con `nodos`
    para nombre y coordenadas) y atracciones con la clave anon; valida cada
    respuesta con los esquemas Zod del dominio. Hooks en
    `src/features/catalogo/use-catalogo.ts`.
  - UI `ExplorarCatalogo.tsx` con dos pestañas **Municipios** y **Atracciones**
    (cambio pedido por el usuario: separar municipios de atracciones). Buscador
    que ignora tildes, filtro por departamento y por estilo, contadores y
    mensajes claros cuando no hay resultados, incluido el de "municipio no
    encontrado" para quien no conoce la región. `FichaAtraccion.tsx` muestra el
    detalle con duración, horario, altitud, costo, días cerrados, avisos de
    guía/acceso y la fuente.
  - Lógica de filtrado y formato pura y probada en `filtrar.ts` y `formato.ts`.
    Pruebas en `src/features/catalogo/filtrar.test.ts` (10) usando el seed real.
    `App.test.tsx` actualizado para el nuevo provider y el mock de lectura.
- Decisiones:
  - Lectura del catálogo con TanStack Query, como indica `plan.md` sección 3
    (aprobado por el usuario). El catálogo es de solo lectura con caché larga,
    el caso ideal para esta librería; además deja listo el terreno para T-17
    (clima) y la lectura de viajes.
  - Esta pantalla es solo para explorar/descubrir. El selector tipo combobox
    para elegir destinos ("escribir o desplegar") se construye en T-13
    (planificador), que es su lugar natural (decisión con el usuario).
  - Precio de las atracciones: se mantiene el camino simple de `plan.md` 6.2
    (tarifa general de adulto, marcada como aproximada). La ficha ahora aclara
    que el precio puede variar por edad o tipo de entrada. El modelo completo de
    tarifas por edad queda como idea I-03 (observación del usuario sobre el
    Parque del Café).
  - No se instaló React Router: todavía hay una sola pantalla. Se añadirá cuando
    haya varias vistas que navegar (decisión con el usuario).
- Hallazgos:
  - El join anidado de PostgREST (`municipios` con `nodos!inner`) confunde al
    tipado de supabase-js; se castea la fila a un tipo explícito vía `unknown` y
    se valida con Zod, coherente con el principio de validación del plan.
  - `react-hooks/exhaustive-deps` avisaba porque un objeto `filtros` intermedio
    se recreaba en cada render; se pasaron los valores primitivos directo a los
    `useMemo`.
  - `npm run format` normalizó a LF los archivos preexistentes con CRLF
    (`src/i18n/index.ts`, `src/index.css`, `src/test/setup.ts`), así que
    `format:check` ahora pasa limpio también en local. El issue de CRLF
    documentado queda resuelto de hecho; un `.gitattributes` sigue siendo mejora
    opcional.
  - El bundle JS pasó de ~313 kB a ~366 kB (107 kB gzip) por TanStack Query.
  - El usuario verificó la vista en el navegador y pidió los cambios de pestañas
    y mensajes; aplicados y validados.
- Criterios de aceptación (F-a sigue abierta, 4/5 tareas; falta T-10, el mapa):
  - "Los filtros funcionan en móvil": **verificado** en código (filtros por
    departamento y estilo, buscador; layout mobile-first) y por el usuario en el
    navegador. Pruebas de la lógica en `filtrar.test.ts`.
  - "Salamina y Aguadas aparecen como pueblos patrimonio": **verificado** (se
    muestran con su etiqueta en la lista de municipios).
  - "Los 53 municipios aparecen en el mapa": pendiente, es T-10.
  - "El seed pasa la validación Zod" y el grafo de buses: verificados en T-08.
  - "Un INSERT con la clave pública sobre atracciones falla": pendiente (RLS).
- Cambios del tablero: T-09 pasa a hecha. Nueva idea I-03 (tarifas por edad).
  Revisión 15. La próxima tarea de la ruta crítica es T-10 (mapa Leaflet).
- Origen: sesión de Kiro con el usuario

### 2026-11-10 — T-10: mapa Leaflet (cierre casi total de la fase a)
- Cierre anterior: 4aca043 (memoria: cierre de T-08)
- Commits: (dos en este cierre: uno de código que cubre T-09 y T-10, otro de
  memoria; según acuerdo con el usuario de commitear al terminar T-10)
- Qué se hizo:
  - T-10 terminada. Mapa Leaflet en `src/features/catalogo/MapaCatalogo.tsx`
    con los 53 municipios como marcadores agrupados (`react-leaflet-cluster`),
    teselas de OpenStreetMap con atribución visible "© OpenStreetMap
    contributors", y popups con el municipio, su etiqueta de pueblo patrimonio y
    enlaces a sus atracciones (que abren la ficha). `icono-leaflet.ts` arregla el
    icono por defecto de Leaflet con Vite.
  - Tercera pestaña **Mapa** en `ExplorarCatalogo`, cargada con `React.lazy` para
    no engordar el arranque: Leaflet queda en un chunk aparte (~206 kB) que solo
    se descarga al abrir el mapa. El bundle inicial se mantiene en ~366 kB.
  - Zoom con rueda desactivado (`scrollWheelZoom={false}`), aprobado por el
    usuario (molesto en móvil y en páginas con scroll).
  - Dependencias fijadas: `leaflet@1.9.4`, `react-leaflet@4.2.1`,
    `react-leaflet-cluster@2.1.0`, `@types/leaflet@1.9.12`.
- Decisiones:
  - Marcadores agrupados con `react-leaflet-cluster` sobre `leaflet.markercluster`,
    compatible con react-leaflet v4 y React 18.
  - El mapa se carga diferido para proteger el arranque en móvil (objetivo
    mobile-first del plan).
  - La caché de teselas en tiempo de ejecución (Workbox, CacheFirst) es parte de
    la PWA y se hará en T-14; en T-10 solo se cumple la atribución y el no usar
    precarga (`plan.md` 6.5).
- Hallazgos:
  - Sin code splitting el bundle llegaba a ~573 kB (aviso de Vite); con el lazy
    del mapa el principal baja a ~366 kB y Leaflet queda en su propio chunk.
  - El mapa lazy no afecta las pruebas: no se monta en la pestaña inicial, así
    que Vitest/jsdom no cargan Leaflet.
- Criterios de aceptación de la fase (a) — revisión completa:
  - "Los 53 municipios aparecen en el mapa": **verificado** (T-10; el usuario lo
    vio en el navegador).
  - "Salamina y Aguadas aparecen como pueblos patrimonio": **verificado** (T-08
    datos; T-09/T-10 los muestran con etiqueta).
  - "Los filtros funcionan en móvil": **verificado** (T-09, mobile-first; pruebas
    en `filtrar.test.ts`; el usuario lo probó).
  - "El seed pasa la validación Zod": **verificado** (T-08).
  - "El grafo de buses conecta todos los municipios y los que no, quedan
    listados": **verificado** (T-08, 0 aislados).
  - "Un INSERT con la clave pública sobre atracciones falla": **pendiente**. Es
    el único criterio sin evidencia. La migración T-07 ya revoca
    insert/update/delete a anon y authenticated, pero falta probarlo. Se crea la
    tarea **T-30** (paralelo, P2) para ello. **Por eso la fase (a) sigue
    formalmente abierta** hasta que T-30 aporte la evidencia; en producto está
    completa (catálogo, filtros y mapa funcionando).
- Cambios del tablero: T-10 pasa a hecha. Nueva tarea T-30 (verificación RLS de
  la fase a). Revisión 16/17. La próxima tarea de la ruta crítica es T-11
  (generador de itinerario, P1).
- Origen: sesión de Kiro con el usuario

#### Cierre de sesión 2026-11-10
- Estado al cerrar: fase 0 cerrada; fase (a) con sus 5 tareas hechas y 5/6
  criterios verificados (falta el criterio RLS, tarea T-30). Tablero rev 17,
  12/30 tareas. 6 commits locales en `dev` sin publicar (desde el cierre de
  fase 0): `0ee6a35`, `4aca043` (T-08), `2ecc20f`, `08a7ec3` (T-09 y T-10), más
  los dos previos de fase 0. Árbol de trabajo limpio.
- Sin decisiones externas que registrar (confirmado por el usuario).
- Próxima tarea: **T-11, generador de itinerario** (ruta crítica, P1). Plan
  acordado con el usuario para la próxima sesión, en `src/domain/itinerario/`:
  1. `tipos.ts` (entrada `EntradaItinerario`, `ClimaDia`; salida `Itinerario`,
     `DiaItinerario`, `ItemItinerario`; resultado ok/no-ok).
  2. `grafo-buses.ts` (Dijkstra con penalización de 30 min por trasbordo;
     municipios inalcanzables).
  3. `puntuacion.ts` (puntuación por estilos y comparador de desempate
     determinista: puntuación desc, costo asc, id asc).
  4. `generador.ts` (construcción voraz, pasos 1-6 de plan.md 6.1).
  5. `busqueda-local.ts` (ascenso de colina con intercambio y 2-opt por día,
     paso 7, determinista).
  6. `index.ts` (`generarItinerario(entrada)`).
  - Alcance de T-11: pasos 1-7 más pruebas de casos límite (1 día, origen igual
    a destino, municipio inalcanzable, traslado largo desde Bogotá, infactible
    por 1 día + origen externo + regreso). El clima entra como parámetro
    (`ClimaDia[]`); el servicio real es T-17. NO incluye: paso 8 presupuesto
    (T-15), paso 9 clima (T-18) ni las 20-30 instancias de evaluación (T-27).
- Pendientes del usuario (sin bloquear): crear `SUPABASE_URL` y
  `SUPABASE_ANON_KEY` en GitHub (consulta diaria anti-pausa); revisar antes de
  la sustentación los costos/tarifas aproximados (R-04) y el acceso al Nevado
  del Ruiz (R-03). Opcional: publicar los 6 commits con `git push`.
- Origen: sesión de Kiro con el usuario

### 2026-11-10 — T-11: generador de itinerario (dominio puro)
- Cierre anterior: 8fe36e7 (memoria: cierre de sesion 2026-11-10 con el plan de T-11)
- Commits: f751373 (feat del generador); este cierre agrega el commit de memoria
- Qué se hizo:
  - T-11 terminada. Generador de itinerario determinista en `src/domain/itinerario/`
    como lógica pura (sin red ni hora del sistema), siguiendo el plan acordado con el
    usuario en el cierre anterior. Seis módulos más dos de pruebas:
    - `tipos.ts`: entrada (`EntradaItinerario`, `ClimaDia`), salida (`Itinerario`,
      `DiaItinerario`, `ItemItinerario`, `DesgloseCostos`) y resultado tipado ok/no-ok
      (`ResultadoItinerario`, `MotivoFallo`). El clima entra como parámetro; el servicio
      real es T-17.
    - `grafo-buses.ts`: `GrafoBuses` con Dijkstra y penalización de 30 min por trasbordo
      (plan.md 6.1 paso 3); desempate por id (determinista); null si no hay camino;
      camino vacío y costo 0 si origen = destino.
    - `puntuacion.ts`: puntuación por coincidencia de estilos y comparador de desempate
      (puntuación desc, costo asc, id asc), plan.md 6.0.
    - `fechas.ts`: aritmética de fechas civiles 'AAAA-MM-DD' en UTC para no depender del
      huso del entorno (plan.md 5.4, zona America/Bogota).
    - `generador.ts`: construcción voraz (pasos 1-6): filtra por municipio/estado/día de
      cierre, elige municipios base por cercanía al origen, reparte actividades
      respetando el límite de jornada (9 h por defecto) con el tiempo de ida y vuelta
      desde el casco (2 × minutos_desde_casco), inserta traslado de llegada el día 1 y de
      regreso el último (días de solo traslado exentos del límite, con aviso), fuerza las
      atracciones obligatorias y calcula costos de alojamiento y comida.
    - `busqueda-local.ts`: ascenso de colina determinista (paso 7): mueve actividades al
      aire libre de días lluviosos a días secos con el mismo municipio base, sin tocar
      ítems fijados, acotado por iteraciones; no cambia el costo total.
    - `index.ts`: `generarItinerario` (voraz + búsqueda local) y `catalogoParaItinerario`
      que arma el subconjunto de catálogo desde el catálogo validado por Zod.
  - Pruebas: `generador.test.ts` (14) y `grafo-buses.test.ts` (5). Casos: determinismo,
    día 1 desde el origen, origen = destino sin traslado de llegada, límite de jornada,
    traslado largo desde Bogotá como solo-traslado, municipio inalcanzable listado,
    infactible (1 día + origen externo + regreso), rango de fechas invertido, origen
    desconocido, sin municipios, obligatorias incluidas, 0 noches, costo escala con
    viajeros; y del grafo: tramo directo, trasbordo con penalización, sin camino, empate
    determinista, origen = destino.
- Decisiones:
  - El módulo no requiere la tabla `nodos`: los municipios y orígenes externos ya llevan
    nombre y coordenadas, así que `CatalogoItinerario` se arma solo con municipios,
    orígenes, atracciones, rutas de bus y tarifas. (Coherente con que `nodos` se deriva en
    el script de carga del seed, no vive en el catálogo validado.)
  - T-11 cubre los pasos 1-7. NO incluye el ajuste de presupuesto (paso 8, T-15), el
    reordenamiento por clima con vista previa (paso 9, T-18) ni las 20-30 instancias de
    evaluación (T-27). El clima entra como `ClimaDia[]` por parámetro (servicio en T-17).
  - El desempate de Dijkstra y de la selección de atracciones es siempre por id, de modo
    que la misma entrada produce el mismo itinerario sin aleatoriedad.
- Hallazgos:
  - `eslint` marcaba `no-constant-condition` por el `while (true)` del bucle de Dijkstra;
    se reescribió con una bandera `quedan` sin cambiar la lógica.
  - No se pudo medir la cobertura: falta la dependencia `@vitest/coverage-v8` y no se
    instaló por no estar acordada para T-11. Queda pendiente para el criterio de
    cobertura de F-b (se puede medir instalando ese provider o junto con T-27).
  - Git avisa LF→CRLF al indexar los archivos nuevos (Windows, core.autocrlf); la CI en
    Ubuntu los ve con LF y pasa, como en cierres anteriores.
- Criterios de aceptación (F-b sigue abierta; T-11 es su primera tarea):
  - "Misma entrada y mismo clima producen el mismo itinerario": **verificado** (prueba de
    determinismo en `generador.test.ts`).
  - "El día 1 parte del origen elegido": **verificado** (prueba).
  - "Ningún día supera el límite de jornada salvo los días de solo traslado marcados":
    **verificado** (prueba con límite 540 y con el caso de Bogotá a 300 min).
  - "0 violaciones de restricciones en las instancias de prueba": **pendiente** (las
    instancias son T-27).
  - "Generación en < 500 ms en un móvil de gama media": **pendiente de medición formal**
    (las pruebas corren en < 35 ms en escritorio; medición ligada a T-27).
  - "Cobertura >= 80 % en domain/itinerario": **pendiente de medir** (falta el provider de
    cobertura; 19 pruebas ejercitan cada módulo).
  - "Los cambios persisten tras recargar": **pendiente** (persistencia es T-13/T-14).
- Cambios del tablero: T-11 pasa a hecha. Sin tareas, riesgos ni ideas nuevos. La próxima
  tarea de la ruta crítica es T-12 (migraciones de datos de usuario con RLS).
- Origen: sesión de Kiro con el usuario

### 2026-11-10 — T-12: migraciones de datos de usuario con RLS
- Cierre anterior: a44cdf9 (memoria: cierre de T-11)
- Commits: 5df9b68 (migración + prueba RLS); este cierre agrega el commit de memoria
- Qué se hizo:
  - T-12 terminada. Migración `supabase/migrations/20261110120000_datos_usuario.sql`
    con las tablas de datos de usuario de plan.md 5.2 y sus RLS por propietario (5.3):
    `perfiles` (PK = auth.users.id ON DELETE CASCADE), `viajes` (con CHECKs de
    fecha_fin >= fecha_inicio y viajeros >= 1, FK de origen a `nodos`, enums de nivel,
    modo_presupuesto y estado, arrays de estilos/municipios/atracciones, umbral_lluvia
    jsonb, version_catalogo), `viaje_dias` (PK viaje_id+dia), `viaje_items` (UNIQUE
    viaje_id+dia+orden; atraccion_id solo en tipo 'actividad'), `metas_ahorro`
    (PK viaje_id) y `aportes_ahorro` (monto > 0). Todas con ON DELETE CASCADE hacia
    auth.users (directa o vía viajes) para que "eliminar cuenta" (T-21) borre todo.
  - RLS: `perfiles` y `viajes` comparan auth.uid() directo; las tablas hijas usan
    EXISTS sobre viajes. Políticas `for all to authenticated` con using + with check.
    Se concede select/insert/update/delete a authenticated y se revoca todo a anon
    (los datos de usuario requieren sesión).
  - Prueba de aislamiento RLS en `supabase/tests/datos_usuario_rls.sql`: crea dos
    usuarios, simula sesión con `set local role authenticated` y
    `set local request.jwt.claims` (sub = uuid), y comprueba con ASSERT que un usuario
    solo ve/modifica sus filas, que no puede crear viajes a nombre de otro (with check)
    ni ver/alterar/borrar los ajenos (ni sus ítems). Toda la prueba va en una
    transacción con ROLLBACK: no deja nada en la base.
- Decisiones:
  - Alcance de T-12 = solo la capa SQL (migración), como fue T-07. Los esquemas Zod de
    los tipos de usuario se harán en T-13/T-14, cuando se consuman (recomendación de
    Claude, avalada por el usuario).
  - Se añadió una prueba RLS (opción b elegida por el usuario) para no dejar nada
    pendiente en la tarea y adelantar evidencia que la fase (e) exigirá.
  - `viaje_items.atraccion_id` solo puede ser no nulo cuando tipo = 'actividad' (CHECK),
    para que traslados, comidas y alojamientos no referencien atracciones.
- Hallazgos:
  - No hay CLI de Supabase, psql ni docker en el entorno local; la migración la aplicó
    el usuario en el SQL Editor y devolvió "Success. No rows returned" (lo esperado para
    DDL).
  - El SQL Editor marca la prueba como "operación destructiva" por detectar
    insert/update/delete; es seguro porque todo se revierte con ROLLBACK. Se documentó y
    el usuario la corrió sobre el archivo completo.
  - "Success. No rows returned" de la prueba no confirma por sí solo que los ASSERT
    corran. Se verificó con dos comprobaciones del usuario: (1) 0 usuarios de prueba
    tras el rollback (la base queda limpia) y (2) un `assert false` de control que sí
    lanzó error, confirmando que los ASSERT se evalúan. Como el script real no lanzó
    error, todas sus aserciones pasaron: aislamiento RLS verificado.
  - Git avisa LF->CRLF al indexar los .sql nuevos (Windows); la CI en Ubuntu los ve con
    LF y pasa.
- Criterios de aceptación: T-12 es una tarea de la fase (b) y no tiene criterios de
  aceptación propios en el tablero; los de RLS directa son de la fase (e). La evidencia
  de aislamiento queda adelantada con la prueba de `supabase/tests/datos_usuario_rls.sql`.
- Cambios del tablero: T-12 pasa a hecha. Sin tareas, riesgos ni ideas nuevos. La
  próxima tarea de la ruta crítica es T-13 (formulario del viaje y vista día por día).
- Origen: sesión de Kiro con el usuario

### 2026-11-10 — T-13: planificador (formulario, generación y vista día por día)
- Cierre anterior: 86646e1 (memoria: cierre de T-12)
- Commits: 7c3562a (feat del planificador); este cierre agrega el commit de memoria
- Qué se hizo:
  - T-13 terminada. Primera pantalla interactiva con estado. Conecta catálogo
    (T-09), generador (T-11) y tablas de usuario (T-12).
  - React Router instalado (`react-router-dom@6.26.2`, pinned). Dos rutas:
    `/explorar` y `/planificar`, con nav en el header. `App.tsx` reescrito con
    `Routes`; `main.tsx` envuelto en `BrowserRouter`; `App.test.tsx` usa
    `MemoryRouter`.
  - Esquemas Zod de datos de usuario en `src/domain/viaje/esquemas.ts`
    (`formularioViajeSchema`, `viaje`, `viajeDia`, `viajeItem`), reflejando la
    migración de T-12. Son los que en T-12 se aplazaron.
  - Servicio ampliado (`src/services/catalogo.ts`): `obtenerOrigenesExternos`,
    `obtenerRutasBus`, `obtenerTarifas` (validados con Zod) y sus hooks en
    `use-catalogo.ts`, porque el generador necesita orígenes, grafo de buses y
    tarifas además de municipios y atracciones.
  - UI en `src/features/planificador/`: `Planificador.tsx` (formulario: título,
    origen, fechas, viajeros, nivel, estilos, municipios, incluir regreso;
    validación con Zod; generación), `SelectorMunicipios.tsx` (combobox buscable
    sin tildes, el que en T-09 se aplazó), `VistaItinerario.tsx` (días con sus
    ítems, costos, reorden y fijado), y helpers puros `armar-entrada.ts`
    (forma la EntradaItinerario), `editar-itinerario.ts` (subir/bajar/fijar y
    orden de destinos) y `hoy.ts` (fecha de hoy en America/Bogota, calculada en
    la UI y pasada al dominio como dato).
  - Observaciones del usuario resueltas en la misma sesión:
    1. No se permiten fechas de viaje en el pasado: inputs `date` con `min`
       (ida = hoy, regreso = fecha de ida) y un refinamiento Zod que rechaza
       `fechaInicio` anterior a `hoy` (hoy se pasa como dato, el dominio no lee
       el reloj).
    2. Botón "Todos" en estilos: selecciona/deselecciona todos de una vez,
       conservando la selección múltiple individual.
    3. Bug de reparto del generador (descubierto con el Parque del Café): el
       generador amontonaba todas las atracciones de un municipio en el primer
       día y dejaba vacíos los demás. Ahora reparte entre los días que comparten
       municipio base, eligiendo el día con más tiempo libre (desempate por día).
       El Parque del Café (450 min, cierra lunes y martes) ahora aparece y se
       reparte; si la fecha cae en día cerrado, se excluye.
    4. Reordenar destinos: panel "Orden de los destinos" con subir/bajar por
       municipio; al reordenar se regenera respetando el orden elegido
       (`EntradaItinerario.ordenMunicipios`), con aviso de que el orden puede no
       ser óptimo.
    5. Traslados fijos: los ítems de tipo traslado ya no se mueven ni se fijan
       sueltos (candado 🔒); su destino se cambia reordenando los destinos, que
       recalcula tiempos y tarifas. Las actividades se siguen reordenando entre
       ellas, saltando los traslados.
- Decisiones:
  - Alcance de T-13 = formulario + generación + vista editable en memoria. NO
    persiste (eso es T-14), no ajusta presupuesto (T-15) ni usa clima real
    (T-17/T-18). Avalado por el usuario.
  - Se instaló React Router ahora (avalado), porque ya hay dos vistas.
  - Para "cambiar el destino de un traslado" se eligió la interpretación A
    (reordenar destinos y recalcular los traslados), no editar el bus suelto,
    que dejaría el día incoherente (llegar a un municipio pero tener el paseo en
    otro). Recomendación de Claude, avalada por el usuario.
  - El reparto por día y el orden de destinos tocan el generador (T-11), pero se
    hicieron aquí porque el usuario los detectó probando T-13 y afectan lo que ve.
  - El formato COP se reutiliza de `features/catalogo/formato.ts` en vez de
    duplicarlo; moverlo a `src/lib` queda como mejora menor.
- Hallazgos:
  - El tipado de supabase-js para selects con columnas explícitas (rutas_bus,
    tarifas) infiere un tipo que incluye el de error; se castea vía `unknown`
    antes de `sinNulos`, coherente con el patrón del join de municipios.
  - Bundle inicial: de ~366 kB a ~417 kB (122 kB gzip) por React Router y el
    planificador. El mapa sigue en su chunk aparte (lazy).
  - La prueba visual (dev server) la hizo el usuario: no se puede arrancar el
    servidor desde la sesión del agente. El usuario aprobó el formulario, el
    reparto del Parque del Café, el botón Todos, el reorden de destinos con su
    aviso y los traslados fijos.
  - Git avisa LF->CRLF al indexar los archivos nuevos (Windows); la CI en Ubuntu
    los ve con LF y pasa.
- Criterios de aceptación (F-b sigue abierta; falta T-14):
  - "Misma entrada y mismo clima producen el mismo itinerario": verificado en
    T-11; el reparto nuevo mantiene el determinismo (desempate por día).
  - "El día 1 parte del origen elegido": verificado (T-11 y la UI).
  - "Ningún día supera el límite de jornada salvo los de solo traslado":
    verificado (T-11).
  - "Los cambios persisten tras recargar": **pendiente**, es T-14 (en T-13 el
    viaje vive en memoria).
  - "0 violaciones en las instancias", "< 500 ms" y "cobertura >= 80 %":
    pendientes (T-27 y provider de cobertura).
  - Verificación: tsc 0, lint 0, format limpio, build ok, 60/60 pruebas
    (12 nuevas: 8 de T-13 inicial + 4 de reorden/parque; más las de validación
    de fechas).
- Cambios del tablero: T-13 pasa a hecha. Dependencia nueva react-router-dom.
  Sin riesgos ni ideas nuevos. La próxima tarea de la ruta crítica es T-14
  (guardar y listar viajes, PWA offline, itinerarios sin cuenta en IndexedDB).
- Origen: sesión de Kiro con el usuario

### 2026-11-10 — T-14 (en curso): guardar viajes con cuenta y sin cuenta (piezas A y B)
- Cierre anterior: 14dd351 (memoria: cierre de T-13)
- Commits: a3e888e (feat piezas A y B, en curso); este cierre agrega el commit de memoria
- Qué se hizo (T-14 NO terminada; fase (b) sigue abierta):
  - T-14 se abordó en tres piezas acordadas con el usuario: A) guardar y listar
    con cuenta (Supabase); B) itinerarios sin cuenta (IndexedDB); C) PWA offline.
    En esta sesión se hicieron A y B (código) y quedaron en verificación. C no se
    empezó.
  - Pieza A: serialización pura `src/features/planificador/persistir.ts`
    (formulario + itinerario -> filas de viajes/viaje_dias/viaje_items, y la
    inversa para mostrar; conserva fijado y costos). Servicio
    `src/services/viajes.ts` (guardarViaje con limpieza si falla un paso,
    listarViajes, obtenerDetalleViaje, eliminarViaje). Hooks en
    `use-viajes.ts` (TanStack Query). Botón "Guardar viaje" en el planificador
    (solo con sesión). Vista "Mis viajes" (`MisViajes.tsx`, ruta /mis-viajes +
    nav) que lista, abre en solo lectura y elimina. `VistaItinerario` acepta
    `soloLectura`.
  - Pieza B: `idb@8.0.0` (pinned). `borrador-local.ts` guarda/lee/borra un
    borrador (formulario + itinerario) en IndexedDB (un borrador, clave
    'actual'). Hook `use-borrador.ts`. Sin sesión, el botón pasa a "Guardar en
    este dispositivo"; con sesión y borrador pendiente, banner para subirlo a la
    cuenta o descartarlo. Pruebas con `fake-indexeddb@6.0.0` (devDependency,
    pinned).
  - Esquemas Zod de viaje de T-13 ampliados: se exportó el tipo `Nivel`.
- Verificación del usuario en el navegador (parcial):
  - 1.1 login OK. 1.3 guardar con cuenta: FALLABA, corregido (ver abajo); tras el
    arreglo el usuario confirmó 1.3 OK. 1.4 "Mis viajes": el usuario guardó SIN
    sesión y no apareció en Mis viajes (es esperado: sin cuenta se guarda solo en
    el dispositivo; el mensaje de la UI era confuso). 2.1-2.3, 2.6, 2.7 OK.
    2.8 (subir el borrador tras iniciar sesión): FALLABA.
- Bugs encontrados y corregidos en esta sesión:
  1. guardarViaje no enviaba `usuario_id`. La tabla `viajes` lo exige (NOT NULL y
     RLS `usuario_id = auth.uid()`), así que el INSERT se rechazaba ("No se pudo
     guardar el viaje"). Arreglado: el servicio toma el id de `auth.getUser()` y
     lo incluye. El mensaje de error del planificador ahora muestra el detalle
     real entre paréntesis.
  2. Flujo de login rompía el guardado sin cuenta -> cuenta (2.8): el login con
     Google hace una redirección completa que borra el itinerario en memoria, y
     Supabase devolvía a `/explorar` (no a `/planificar`), donde no se ve el
     banner para subir el borrador. Arreglos: a) `iniciarSesionGoogle(destino?)`
     acepta la ruta de retorno y el planificador pide volver a `/planificar`;
     b) al iniciar sesión desde el planificador con un itinerario generado, se
     guarda el borrador en IndexedDB ANTES de redirigir; c) enlaces de inicio de
     sesión dentro del planificador (en el aviso y en el mensaje de guardado
     local), para no subir al botón de la cabecera.
- Decisiones:
  - "Mis viajes" lista solo viajes de la cuenta (Supabase). Sin sesión, guardar
    es local (IndexedDB) y aparece como borrador para subir al iniciar sesión; no
    va a "Mis viajes". Hay que dejarlo más claro en la UI (pendiente menor).
  - Para preservar el viaje a través del login (que recarga la página), la vía es
    el borrador en IndexedDB: guardarlo antes de redirigir y ofrecer subirlo al
    volver. Es el mecanismo de la pieza B.
  - Dependencias nuevas: idb@8.0.0 (runtime), fake-indexeddb@6.0.0 (dev).
- Hallazgos / pendientes para RETOMAR:
  - PENDIENTE DEL USUARIO EN SUPABASE (bloquea la re-prueba de 2.8): agregar la
    Redirect URL `http://localhost:5173/planificar` (o el comodín
    `http://localhost:5173/**`) en Authentication -> URL Configuration, dejando
    también `http://localhost:5173`. Sin esto, el login que vuelve a /planificar
    falla por redirección no permitida.
  - No se pudo verificar en el navegador desde la sesión del agente (no arranca
    el dev server). Las piezas A y B quedan verificadas por tests en lo puro
    (persistir, borrador con fake-indexeddb) y por tsc/lint/build; el flujo real
    con Supabase lo prueba el usuario en la próxima sesión.
  - En la próxima sesión, re-probar: (1.3-1.6) guardar/listar/abrir/recargar/
    eliminar con cuenta; (2.8) sin sesión -> enlace de login en el planificador
    -> vuelve a /planificar -> banner -> "Subir a mi cuenta" -> aparece en Mis
    viajes y persiste tras recargar.
  - Queda sin hacer la pieza C (PWA: vite-plugin-pwa/Workbox, lectura offline del
    itinerario y caché de teselas OSM en runtime). Iconos: el usuario eligió
    placeholder (opción a).
  - Idea del usuario (1.2): modo "no conozco los municipios" que recomiende
    destinos a partir de estilos y tiempos de bus, preguntando cuántos municipios
    o días. Es una FUNCIONALIDAD NUEVA, no un bug. Se registra como idea I-04
    para evaluar después de T-14 (el usuario aún no decidió si se vuelve tarea).
  - Mejora menor pendiente: aclarar en la UI que "guardar sin cuenta" es local y
    no aparece en "Mis viajes" hasta subirlo.
- Verificación técnica: tsc 0, lint 0, format limpio, build ok, 69/69 pruebas
  (9 nuevas: 5 de persistir, 4 de borrador local).
- Cambios del tablero: T-14 pasa a en_curso. Nueva idea I-04 (recomendar
  municipios). Sin riesgos nuevos. La tarea en curso de la ruta crítica es T-14
  (faltan: verificar A y B con la Redirect URL, y hacer la pieza C/PWA).
- Origen: sesión de Kiro con el usuario

### 2026-11-11 — T-14: guardar viajes con cuenta y PWA offline (cierre con recorte de alcance)
- Cierre anterior: 5690d24 (memoria: cierre de sesion 2026-11-10, T-14 en curso)
- Commits: (este cierre agrega el commit de codigo y el de memoria)
- Qué se hizo:
  - **T-14 terminada con el alcance ajustado.** Quedan la pieza A (guardar/listar
    con cuenta) y la pieza C (PWA offline), ambas verificadas por el usuario en el
    navegador. La pieza B (guardado local sin cuenta en IndexedDB) se retiró.
  - **Recorte de alcance (decisión del usuario):** el guardado local sin cuenta
    (itinerario en IndexedDB con subida al iniciar sesión, supuesto 1.2.3 de
    `plan.md`) se difiere a futuras entregas. Guardar requiere iniciar sesión con
    Google. Se registró en `plan.md` (secciones 1.2.3, 1.3, 2.2, arquitectura y
    fase b) y como idea I-05 en el tablero.
  - Se eliminaron `borrador-local.ts`, `borrador-local.test.ts` y `use-borrador.ts`;
    se quitaron las dependencias `idb` y `fake-indexeddb`; se limpiaron los textos
    i18n del borrador local. La UI sin sesión ahora solo invita a iniciar sesión.
  - **Bug corregido (pieza A):** el itinerario se perdía al iniciar sesión, porque
    el login OAuth recarga la página y el itinerario vivía solo en el estado de
    React (antes lo cubría el borrador local eliminado). Se resolvió con
    `viaje-pendiente.ts`, que guarda el `{formulario, itinerario}` en
    `sessionStorage` antes del login y lo restaura al volver con sesión, ofreciendo
    guardarlo. No es IndexedDB ni el guardado sin cuenta diferido: es un puente
    efímero que dura lo que la pestaña.
  - **Antes del recorte** se halló y corrigió otro bug: la función del borrador
    local estaba declarada como `zguardarBorrador` (una `z` sobrante de una edición
    accidental), lo que rompía el import `guardarBorrador`.
  - **Pieza C (PWA) con `vite-plugin-pwa@0.20.5`** (devDependency pinada, compatible
    con Vite 5): `registerType: 'autoUpdate'`, `manifest` con iconos placeholder
    (rectángulos emerald en `public/`), `runtimeCaching` con teselas de OSM en
    `CacheFirst` (500 entradas, 30 días; sin precarga, plan.md 6.5) y REST de
    Supabase en `NetworkFirst` (respaldo a caché para leer offline), precache del
    shell y `navigateFallback` a `/index.html`. `registerSW` en `main.tsx`,
    `vite-plugin-pwa/client` en `vite-env.d.ts`, meta `theme-color` y
    `apple-touch-icon` en `index.html`, `dev-dist` en `.gitignore`.
    `devOptions.enabled = false` (el SW no corre en `npm run dev`).
- Decisiones:
  - Diferir el guardado sin cuenta en vez de seguir depurándolo: el flujo sin
    sesión no quedó confiable y se priorizó avanzar la fase (b) (pedido del usuario;
    se registró en `plan.md` como recorte por alcance).
  - Preservar el itinerario durante el login con `sessionStorage` y no con
    IndexedDB: es un puente efímero del login, no persistencia local, así que no
    reintroduce la pieza B diferida (propuesta de Claude).
  - `vite-plugin-pwa` 0.20.x en lugar de 1.x: la línea 0.20 es estable con Vite 5,
    que es la versión del proyecto (propuesta de Claude).
  - Iconos placeholder (opción a, ya elegida por el usuario): se reemplazan por el
    diseño real en el pulido (fase final).
- Hallazgos:
  - El entorno del agente no arranca el servidor; las pruebas visuales de A
    (guardar tras login) y C (offline, manifest) las hizo el usuario.
  - El SW se genera bien (`dist/sw.js`, `manifest.webmanifest`, 19 entradas de
    precache). La lectura offline exige una primera carga online completa antes de
    cortar la red.
  - En PowerShell 5.1, `tablero.py cambio` con JSON se sigue aplicando con un runner
    Python que llama a `cambio()` leyendo el JSON de un archivo (ya borrado). La
    operación `nota` usa el campo `texto` (no `detalle`) y antepone sola la fecha y
    el autor; `idea_agregar` usa `{"idea": {...}}` y autogenera el id.
  - El bundle principal quedó en ~429 kB (126 kB gzip); salió `idb` y entró
    `workbox-window` (~5,7 kB). El mapa sigue en su chunk aparte (~206 kB).
- Criterios de aceptación (F-b, ahora 4/5 tareas; falta T-15):
  - "Los cambios persisten tras recargar": **verificado** (guardar con cuenta,
    abrir y recargar; el usuario lo probó).
  - "Misma entrada y mismo clima producen el mismo itinerario", "el día 1 parte del
    origen", "ningún día supera el límite salvo traslados", "0 violaciones en las
    instancias": verificados en T-11 (dominio).
  - "Generación en < 500 ms en móvil de gama media": pendiente de medir.
  - "Cobertura >= 80 % en domain/itinerario": pendiente (falta el provider
    `@vitest/coverage-v8`).
  - Lectura offline del itinerario (PWA): **verificado** por el usuario (recarga sin
    red carga el shell y el itinerario visto).
- Cambios del tablero: T-14 pasa a hecha; su título se ajustó para reflejar el
  recorte. Nueva idea I-05 (guardado sin cuenta, diferido). Revisión 22. La próxima
  tarea de la ruta crítica es T-15 (presupuesto, paso 8).
- Origen: sesión de Kiro con el usuario

### 2026-11-11 — T-15: presupuesto (desglose y ajuste a monto fijo)
- Cierre anterior: 156337e (memoria: cierre de T-14)
- Commits: (este cierre agrega el commit de código y el de memoria)
- Qué se hizo:
  - **T-15 terminada.** Dominio puro en `src/domain/presupuesto/`:
    - `tipos.ts`: `ResultadoAjuste` (ok con itinerario ajustado, desglose, niveles
      finales y actividades quitadas; o no-ok con `minimoCop` e itinerario mínimo),
      `PresupuestoDesglose` (grupo y por persona) y `NIVELES_ASC`.
    - `desglose.ts`: desglose por persona (division por rubro con `ceil`, sin
      dividir por cero), plan.md 6.2.
    - `ajustar.ts`: paso 8 de plan.md 6.1. Baja alojamiento y luego comida escalón
      a escalón (regenerando con el nivel menor), y si aún no alcanza poda
      actividades NO obligatorias en orden ascendente de `puntuación / max(costo,1)`
      con desempate por id, parando apenas `total <= monto`. Si ni el económico sin
      actividades alcanza, devuelve `{ ok:false, minimoCop }`. Las obligatorias
      nunca se quitan. Determinista.
    - `index.ts`: reexporta `desglosar` y `ajustarAPresupuesto`.
  - UI `PanelPresupuesto.tsx` conectada al planificador: desglose (transporte,
    alojamiento, comida, entradas+actividades, total y por persona), campo de monto
    y botón "Ajustar a mi presupuesto"; muestra el resultado (ajustado con niveles
    finales y actividades quitadas, o el aviso con el mínimo si no alcanza).
    Reutiliza `formatearCOP` de `features/catalogo/formato.ts`.
  - `armar-entrada.ts` admite `ordenMunicipios` (4º parámetro `extra`) para que el
    ajuste regenere con la misma ruta que eligió el usuario.
  - Pruebas `ajustar.test.ts` (9) con el seed real.
- Decisiones:
  - Bajar niveles **regenerando** el itinerario con `generarItinerario` en vez de
    editar el existente: bajar un escalón cambia las tarifas de todos los días, así
    que regenerar es lo correcto y se mantiene determinista (propuesta de Claude).
  - Cuando alojamiento y comida quedan en niveles distintos, se regenera con cada
    uno y se combinan los rubros (alojamiento de uno, comida del otro), porque el
    generador usa un único `nivel` por corrida (propuesta de Claude).
  - La poda de actividades sí opera sobre el itinerario ya armado, recalculando los
    costos por tipo desde los ítems, para respetar el orden de sacrificio del plan.
  - El reparto por persona usa `Math.ceil` para no subestimar el costo por viajero
    (propuesta de Claude).
- Hallazgos:
  - El entorno del agente no arranca el servidor; la verificación visual del panel
    la hará el usuario. El dominio quedó probado contra el seed real (tarifas
    económico/medio/alto para alojamiento y comida; Salento con 2 atracciones
    reales).
  - `t(clave)` exige inferir la clave como literal para saber si lleva parámetros;
    iterar `t(f.clave)` con `clave: string` o una unión rompía el tipado. Se
    resolvió resolviendo el texto al construir el arreglo del desglose.
  - El bundle principal subió a ~435 kB (127 kB gzip) por el panel y el dominio de
    presupuesto.
- Criterios de aceptación (F-c sigue abierta, falta T-16):
  - "Cuando existe un itinerario factible, el ajustado nunca supera el monto fijo":
    **verificado** (prueba del monto intermedio; el ajustado cumple `<= monto`).
  - "Cuando no existe, se muestra el mínimo y no se guarda como ajustado":
    **verificado** (devuelve `ok:false` con `minimoCop` y el itinerario mínimo).
  - "Las atracciones obligatorias nunca se quitan": **verificado** (prueba con
    `valle-de-cocora` obligatoria y monto 1).
  - "Pruebas unitarias de los cálculos, incluidos 0 noches": **verificado** (prueba
    de 1 día sin noches y desglose por persona).
  - "La cuota se recalcula al registrar aportes y no es negativa ni divide por
    cero": **pendiente**, es del modo soñado (T-16).
- Cambios del tablero: T-15 pasa a hecha. Revisión 23. La próxima tarea de la ruta
  crítica es T-16 (modo soñado: meta de ahorro y aportes), que depende de T-15
  (hecha) y T-14 (hecha). En paralelo siguen disponibles T-17, T-25, T-27 y T-30.
- Origen: sesión de Kiro con el usuario
