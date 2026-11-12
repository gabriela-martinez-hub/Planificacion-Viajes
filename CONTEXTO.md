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

Planificador (2026-11-10, ver `HISTORIA.md`):
- React Router (`react-router-dom@6.26.2`) con rutas `/explorar` y `/planificar`
  (se instaló al haber dos vistas).
- El generador acepta `EntradaItinerario.ordenMunicipios`: si la UI lo pasa,
  respeta ese orden de destinos en vez de ordenar por cercanía. Lo usa el reorden
  de destinos del planificador.
- "Cambiar el destino de un traslado" se resuelve reordenando los destinos y
  recalculando los traslados (interpretación A), no editando el bus suelto, que
  dejaría el día incoherente. Los traslados quedan fijos en la vista.
- El generador reparte las atracciones entre los días que comparten municipio
  base (no las amontona en el primer día); corregido al detectar el caso del
  Parque del Café.
- Las fechas de viaje no pueden estar en el pasado: se valida en el formulario
  (atributo `min`) y en Zod, pasando la fecha de hoy (America/Bogota) como dato
  al dominio.

Guardado de viajes y PWA (2026-11-11, ver `HISTORIA.md`):
- Para guardar un viaje hace falta iniciar sesión con Google. El guardado local
  sin cuenta (itinerario en IndexedDB con subida al iniciar sesión, supuesto
  1.2.3 original) se difirió a futuras entregas por alcance (idea I-05; `plan.md`
  1.3 y 2.2).
- El itinerario se preserva durante el login con `sessionStorage`
  (`viaje-pendiente.ts`), no con IndexedDB: es un puente efímero que dura lo que la
  pestaña, no persistencia local.
- PWA con `vite-plugin-pwa@0.20.5`: lectura offline del itinerario y del shell,
  caché de teselas OSM (CacheFirst, sin precarga) y de la REST de Supabase
  (NetworkFirst). Los iconos son placeholder hasta el pulido (fase final). El SW
  no corre con `npm run dev` (`devOptions.enabled = false`); se prueba con
  `npm run build && npm run preview`.

Presupuesto (2026-11-11, ver `HISTORIA.md`):
- El ajuste a monto fijo (plan.md 6.1 paso 8) vive en `src/domain/presupuesto/`
  y baja niveles **regenerando** el itinerario (bajar un escalón cambia las
  tarifas de todos los días), no editándolo. Primero alojamiento, luego comida;
  si no basta, poda actividades no obligatorias por `puntuación/costo` (desempate
  por id). Las obligatorias nunca se quitan. Es determinista.
- El desglose por persona divide cada rubro con `Math.ceil` para no subestimar.
- El modo soñado (T-16) vive en el detalle de un viaje guardado (necesita
  `viaje_id`): la meta y los aportes se guardan en `metas_ahorro`/`aportes_ahorro`
  y la cuota NO se guarda, se calcula siempre en `domain/presupuesto/ahorro.ts`
  sobre la meta, los aportes y la fecha de hoy. `fecha_inicio == hoy` cuenta como
  meta vencida. Los "meses" de la cuota son meses de calendario.

Clima (2026-11-12, fase d, ver `HISTORIA.md`):
- El clima entra como `ClimaDia[]` al generador. El dominio puro
  `src/domain/clima/` clasifica cada día como lluvioso o seco (prob ≥ 60 % o
  precip ≥ 5 mm; umbrales configurables) y elige la fuente por **horizonte
  dinámico respecto a hoy**: días 1-7 pronóstico, 8-16 tendencia, >16 promedio
  histórico. No se inventa pronóstico más allá de 16 días (límite de Open-Meteo);
  para fechas lejanas se usa el promedio con aviso explícito.
- Servicio `src/services/clima.ts` (Open-Meteo forecast + archive, Zod, resultado
  tipado ok/no-ok, varios lugares en una llamada, respaldo a `clima_mensual`).
  Hooks `src/features/clima/` con caché de 3 h (`usePronostico`,
  `useClimaMensual(Varios)`, `useClimaViaje`). Atribución "Datos del clima:
  Open-Meteo" visible.
- `clima_mensual` se generó con `scripts/generar-clima-mensual.ts` (reanudable,
  respeta la cuota; `npm run clima:generar`): 636 filas (53×12) de 5 años de la
  API histórica, en `supabase/seed/datos/clima.ts`, cargadas en Supabase.
- Reorganización por clima (paso 9): `reorganizarPorClima` reutiliza la búsqueda
  local; mueve actividades al aire libre de días lluviosos a días secos con la
  misma base, sin tocar fijados, respetando la jornada, conservando el costo
  total, determinista, y devuelve un candidato para **vista previa** antes de
  aplicar. En la UI: indicador de clima por día y `PanelClima` con el botón
  "Reorganizar por clima" (aplicar/descartar) y aviso de respaldo sin red.

Evaluación del generador (2026-11-12, T-27, ver `HISTORIA.md`):
- El entregable académico vive en `src/domain/itinerario/instancias/`: función
  objetivo y verificador de restricciones (`objetivo.ts`), óptimo por fuerza
  bruta ≤ 8 (`fuerza-bruta.ts`), 24 instancias (`casos.ts`), evaluador e informe
  (`npm run evaluar` → `INFORME.md`). Se reporta "instancias en el óptimo"
  (12/14) y diferencia absoluta, no un promedio de % (inestable cuando el óptimo
  es pequeño). Dependencia `@vitest/coverage-v8` para medir cobertura.

Infraestructura de Supabase por CLI (2026-11-12, ver `HISTORIA.md`):
- El agente ahora aplica migraciones y pruebas SQL **por su cuenta**. El usuario
  instaló la **Supabase CLI v2.122.1** (binario `.deb`) y **`psql` 16** (cliente),
  y agregó `SUPABASE_DB_PASSWORD` a `.env`. Se evita `supabase link` (pide access
  token) usando conexión directa por `--db-url` (host
  `db.<ref>.supabase.co`, contraseña percent-encoded leída del `.env`):
  `supabase db push --db-url ...` para migraciones y `psql ... -f archivo.sql`
  para las pruebas SQL (multi-sentencia, con `ROLLBACK`). Se mantiene la CLI v2
  estable (no la v3/v4, que cambia los defaults a "local salvo `--linked`").
- El historial de migraciones de la CLI se reconcilió con `supabase migration
  repair --status applied` para T-07 y T-12 (ya aplicadas por el usuario en el
  SQL Editor). `.gitignore` incluye `supabase/.temp/`.

Insignias, check-in y perfil (2026-11-12, fase e, ver `HISTORIA.md`):
- **Backend (T-19):** migración `20261112130000_checkins_insignias.sql`. Tablas
  `checkins` (sin lat/lon del usuario, `id_cliente` único) e `insignias_usuario`
  (`verificada` monótona). Función `distancia_haversine_m`. RPC
  `registrar_checkin` (`SECURITY DEFINER`, parámetros
  `p_lugar_id, p_lat, p_lon, p_precision_m, p_id_cliente, p_manual`): resuelve el
  lugar (atracción o casco del municipio), calcula distancia en el servidor,
  decide `verificado = distancia + precision <= radio`, descarta coordenadas,
  idempotente por `id_cliente`; con `p_manual = true` guarda no verificado sin
  coordenadas. Trigger `recalcular_insignias_usuario` (otorga con todos los
  componentes; verificada con ≥ ceil(0.8·n)). RLS: solo SELECT de lo propio;
  ninguna escritura directa del cliente. Migración
  `20261112140000_eliminar_cuenta.sql` con la RPC `eliminar_mi_cuenta`
  (`SECURITY DEFINER`, borra `auth.users`; CASCADE arrastra perfiles, viajes y
  sus hijos, checkins e insignias).
- **Dominio puro:** `src/domain/geo/` (haversine + `verificarCheckin`, reflejo de
  la regla del servidor) y `src/domain/insignias/` (`esquemas.ts` con Zod de
  `checkins`/`insignias_usuario`; `progreso.ts` que refleja el trigger para
  mostrar el avance). Ambos con pruebas.
- **Cliente (T-20/T-21):** servicios `src/services/perfil.ts` (consentimiento,
  eliminar cuenta) y `src/services/checkins.ts` (RPC `registrar_checkin` —
  **primer uso de `supabase.rpc()`** — y lecturas, validadas con Zod). Hooks en
  `src/features/privacidad/` (consentimiento, eliminar cuenta) y
  `src/features/insignias/` (checkins, insignias). `src/lib/use-conexion.ts`
  (`navigator.onLine`), `src/lib/geolocalizacion.ts` (`getCurrentPosition` con
  errores tipados). Check-in montado en la ficha de atracción; perfil en
  `/perfil` (mapa lazy de municipios visitados, progreso por depto/ruta,
  insignias, eliminar cuenta). La política de datos se copia a `public/` para
  enlazarla.
- El check-in geo falla en **Chromium/Linux** (NetworkLocationProvider de Google:
  "Response was malformed"); es limitación del navegador (funciona en Firefox y
  en móvil con GPS). El registro manual cubre ese caso (coherente con R-06).
- La eliminación de cuenta **real no se ha ejecutado** (destructiva); probada con
  ROLLBACK. Queda para verificación del usuario con una cuenta de prueba.

Accesibilidad y pulido (2026-11-12, T-28, ver `HISTORIA.md`):
- `eslint-plugin-jsx-a11y@6.9.0` (recommended) en el lint (0 avisos). Foco visible
  (`:focus-visible`) y `prefers-reduced-motion` en `src/index.css`. Skip link,
  `<nav>` con nombre accesible (`nav.principal`) y `<main id="contenido">`.
  Modales con `src/lib/use-modal-accesible.ts` (Escape, foco al abrir, restaurar
  al cerrar). Contraste de texto informativo subido de `slate-400` a `slate-500`.
  Rendimiento: Leaflet en chunk aparte y mapas diferidos (confirmado).

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
- Uso sin cuenta con guardado local en IndexedDB (supuesto 1.2.3 original):
  reemplazado por "guardar requiere iniciar sesión". El guardado local sin cuenta
  se difiere a futuras entregas por alcance (2026-11-11, idea I-05).
- "El agente no tiene CLI de Supabase, psql ni docker, así que las migraciones
  las aplica el usuario": reemplazado (2026-11-12). El usuario instaló la Supabase
  CLI y `psql`; ahora el agente aplica migraciones (`db push --db-url`) y corre
  las pruebas SQL (`psql -f`) por su cuenta, leyendo la contraseña de la base del
  `.env`.
- "Entorno Windows/PowerShell" (notas de `tablero.py cambio` cortado y CRLF):
  ya no aplica. La sesión corre en **Linux (Pop!_OS)** con zsh; `tablero.py
  cambio` recibe el JSON completo y los finales de línea son LF.

## Estado actual
- Tablero en **revisión 27: 28/30 tareas (93 %)**, 6 riesgos activos y 5 ideas.
- **Fases cerradas: 0, (a), (b), (c), (d) y (e).** Solo queda abierta la **fase
  final (pulido), 1/3**. Próxima tarea de la ruta crítica: **T-22** (prueba
  end-to-end en Playwright).
- **Fase (e) cerrada (3/3 tareas, 8/8 criterios)** con T-19, T-20 y T-21. Todos
  los criterios de servidor verificados contra la base con pruebas SQL
  (`checkins_insignias_rls.sql` y `eliminar_cuenta.sql`, ambas verdes con
  ROLLBACK): check-in por radio/precisión, RLS sin escritura directa,
  idempotencia, insignia de departamento, umbral 80 % (79 vs 80, Quindío 12→10),
  insignias manuales distinguibles, borrado en cascada; más las pruebas de
  `domain/geo`.
- **Fase final: T-28 hecha (1/3).** Quedan T-22 (e2e Playwright, claude) y T-23
  (despliegue, usuario).
- Verificación global al cerrar: tsc 0, lint 0 (con jsx-a11y), format limpio,
  **152/152 pruebas**, build ok con PWA.
- `dev` está **9 commits por delante de `origin/dev`** sin publicar: los 5 del
  cierre anterior más `0dd89d3` (T-19), `01a3ed7` (T-20), `20c7576` (T-21),
  `28232b8` (T-28) y el commit de memoria de este cierre.
- Entorno: **Linux (Pop!_OS 24.04), zsh.** Hay Node, `python3`, **Supabase CLI
  v2.122.1 y `psql` 16**; el agente aplica migraciones y pruebas SQL contra la
  base vía `--db-url` (contraseña en `.env`). El agente no arranca `npm run dev`
  ni ve el navegador: las pruebas visuales y la eliminación de cuenta real las
  hace el usuario.

<!-- Histórico detallado por tarea en HISTORIA.md. -->

## Historial de tareas (resumen)
- **T-16 hecha (2026-11-11): modo viaje soñado (cierra la fase c).**
  - Dominio puro `src/domain/presupuesto/ahorro.ts`: `calcularAhorro` (periodos =
    semanas/meses completos entre hoy y `fecha_inicio`; cuota = `max(0,
    ceil((meta − ahorrado) / max(1, periodos)))`; estados activa/cumplida/vencida;
    sin dividir por cero ni cuota negativa; no lee el reloj). Helpers de fechas
    `semanasEntre` y `mesesEntre` en `itinerario/fechas.ts`.
  - Persistencia: `src/services/metas-ahorro.ts` (meta con upsert, aportes) sobre
    `metas_ahorro`/`aportes_ahorro` (T-12, con RLS); hooks `use-metas-ahorro.ts`.
  - UI `PanelMetaAhorro.tsx` en el detalle de **Mis viajes** (necesita `viaje_id`):
    meta, barra de progreso, cuota y aportes. Pruebas `ahorro.test.ts` (10).
    Verificación: tsc 0, lint 0, format limpio, build ok, 84/84 pruebas. El usuario
    dio el aval en el navegador.
- **T-15 hecha (2026-11-11): presupuesto, desglose y ajuste a monto fijo.**
  - Dominio puro `src/domain/presupuesto/`: `tipos.ts`, `desglose.ts` (total y
    por persona, 6.2), `ajustar.ts` (paso 8 de 6.1: baja alojamiento y luego
    comida escalón a escalón regenerando, después poda actividades no
    obligatorias por `puntuación/costo` con desempate por id; si ni el económico
    sin actividades alcanza devuelve `ok:false` con `minimoCop`; las obligatorias
    nunca se quitan; determinista), `index.ts`.
  - UI `PanelPresupuesto.tsx` en el planificador: desglose, campo de monto, botón
    "Ajustar a mi presupuesto" y mensajes de ajustado / no alcanza. Reutiliza
    `formatearCOP`. `armar-entrada.ts` admite `ordenMunicipios` para que el ajuste
    regenere con la misma ruta.
  - Pruebas `ajustar.test.ts` (9) con el seed real. Verificación: tsc 0, lint 0,
    format limpio, build ok, 74/74 pruebas. Falta probar el panel en el navegador.
- **T-14 cerrada con alcance ajustado (2026-11-11):** guardar/listar viajes con
  cuenta (pieza A) y PWA offline (pieza C), ambas verificadas por el usuario en el
  navegador. El guardado local sin cuenta en IndexedDB (pieza B) se **retiró del
  MVP** y se difirió a futuras entregas por alcance (idea I-05; `plan.md` 1.3 y
  2.2).
  - Pieza A: `src/services/viajes.ts` (guardar/listar/detalle/eliminar, envía
    `usuario_id` que la RLS exige), `persistir.ts` (serializa/reconstruye, puro y
    probado), hooks `use-viajes.ts`, botón "Guardar viaje" en el planificador y
    vista "Mis viajes" (`MisViajes.tsx`, ruta `/mis-viajes`, solo lectura).
  - Puente del login: `viaje-pendiente.ts` guarda el `{formulario, itinerario}` en
    `sessionStorage` antes de iniciar sesión y lo restaura al volver con sesión
    (el login OAuth recarga la página). No es IndexedDB ni persistencia local; es
    efímero y dura lo que la pestaña. Corrige el bug de perder el itinerario al
    iniciar sesión.
  - Pieza C (PWA): `vite-plugin-pwa@0.20.5` en `vite.config.ts` con manifest
    (iconos placeholder en `public/`), SW `autoUpdate`, `runtimeCaching` de teselas
    OSM (CacheFirst, sin precarga) y REST de Supabase (NetworkFirst), precache del
    shell y `navigateFallback` a `/index.html`. `registerSW` en `main.tsx`.
    `devOptions.enabled = false` (el SW no corre con `npm run dev`; se prueba con
    `build` + `preview`).
  - Eliminados `borrador-local.ts`, `use-borrador.ts` y su prueba; quitadas las
    dependencias `idb` y `fake-indexeddb`. La UI sin sesión solo invita a iniciar
    sesión. Verificación: tsc 0, lint 0, format limpio, 65/65 pruebas, build
    genera `sw.js`.
- **Planificador funcionando (T-13, 2026-11-10):** `src/features/planificador/`
  con `Planificador.tsx` (formulario validado con Zod, botón "Todos" en estilos,
  sin fechas en el pasado), `SelectorMunicipios.tsx` (combobox buscable) y
  `VistaItinerario.tsx` (días editables: subir/bajar y fijar actividades;
  traslados fijos con candado; panel de orden de destinos con aviso de orden no
  óptimo). Helpers puros `armar-entrada.ts`, `editar-itinerario.ts`, `hoy.ts`.
  Esquemas Zod de usuario en `src/domain/viaje/esquemas.ts`. React Router
  (`react-router-dom@6.26.2`) con rutas `/explorar` y `/planificar`. El servicio
  de catálogo ahora lee orígenes externos, rutas de bus y tarifas. Todo en
  memoria (persistir es T-14). El usuario verificó la pantalla en el navegador.
- **Generador de itinerario listo (T-11, 2026-11-10):** lógica pura en
  `src/domain/itinerario/` (commit f751373). Módulos: `tipos.ts` (entrada,
  salida y resultado ok/no-ok), `grafo-buses.ts` (Dijkstra con penalización de
  30 min por trasbordo), `puntuacion.ts` (estilos + desempate determinista),
  `fechas.ts` (fechas civiles en UTC), `generador.ts` (construcción voraz, pasos
  1-6), `busqueda-local.ts` (ascenso de colina, paso 7) e `index.ts`
  (`generarItinerario` y `catalogoParaItinerario`). Pruebas en
  `generador.test.ts` (14) y `grafo-buses.test.ts` (5). Cubre los pasos 1-7; el
  presupuesto (paso 8) es T-15, el reordenamiento por clima (paso 9) es T-18 y
  las 20-30 instancias de evaluación son T-27. El clima entra como `ClimaDia[]`
  por parámetro (servicio en T-17). Verificado: tsc 0, lint 0, build ok, 41/41
  pruebas en total.
- **Datos de usuario en la base (T-12, 2026-11-10):** migración
  `supabase/migrations/20261110120000_datos_usuario.sql` con las tablas de
  plan.md 5.2 (`perfiles`, `viajes`, `viaje_dias`, `viaje_items`, `metas_ahorro`,
  `aportes_ahorro`) y RLS por propietario (5.3): perfiles/viajes comparan
  auth.uid() directo y las hijas con EXISTS sobre viajes; todo cuelga de
  auth.users con ON DELETE CASCADE. El usuario la aplicó en Supabase. El
  aislamiento se verificó con `supabase/tests/datos_usuario_rls.sql` (ASSERT en
  una transacción con ROLLBACK): un usuario no ve ni modifica los datos de otro,
  confirmado con las comprobaciones de limpieza (0 filas) y del arnés de ASSERT.
  Los esquemas Zod de estos tipos se harán en T-13/T-14. checkins e
  insignias_usuario son T-19.
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
1. **T-22 (siguiente en la ruta crítica):** prueba end-to-end en Playwright del
   flujo principal (crear viaje → ajustar presupuesto → ver clima → check-in,
   con `context.setGeolocation`). Depende de T-21, T-18, T-16 (hechas). Habrá que
   instalar y configurar Playwright (no está en el proyecto).
2. **T-23 (usuario):** despliegue con `Referrer-Policy` correcta y verificación
   de que Supabase no está pausado antes de la sustentación. Depende de T-22.
3. **Verificación pendiente del usuario en el navegador** (no bloquea el código):
   check-in geo (en Firefox o móvil; en Chromium/Linux usar el registro manual) y
   **eliminar cuenta con una cuenta de prueba desechable** (es destructiva).
4. Usuario (cuando quiera): crear `SUPABASE_URL` y `SUPABASE_ANON_KEY` en GitHub
   para la consulta diaria contra la pausa; publicar los commits con `git push`.
5. Antes de la sustentación: reemplazar los iconos placeholder de la PWA por el
   diseño real; revisar costos/tarifas/tiempos del seed (R-04) y el acceso al
   Nevado del Ruiz (R-03).

## Pendientes de decisión del usuario
- Decidir si las ideas I-04 (recomendar municipios) e I-05 (guardado local sin
  cuenta, diferido) se vuelven tareas en una entrega futura.
- Si se agrega un `.gitattributes` para normalizar los finales de línea a LF
  (mejora opcional; hoy todo está en LF).
- Sobre el diseño del producto no hay preguntas abiertas (`plan.md`, sección 10).
