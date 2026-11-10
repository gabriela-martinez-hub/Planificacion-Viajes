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
