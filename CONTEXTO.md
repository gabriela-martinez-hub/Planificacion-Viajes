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

## Estado actual
- **Fase 0 cerrada** (7/8 tareas; T-29 es una verificación opcional que el
  usuario pospuso). Los 5 criterios de aceptación están verificados.
- Tablero en revisión 22: 16/30 tareas hechas, 6 riesgos activos y 5 ideas. La
  fase (a) va 5/5 tareas pero sigue formalmente abierta por el criterio RLS sin
  evidencia (T-30). La **fase (b) va 4/5**: T-11, T-12, T-13 y **T-14 hechas**;
  falta T-15 (presupuesto).
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
1. **T-15 (siguiente en la ruta crítica):** presupuesto, paso 8 del generador
   (desglose 6.2 y modo fijo con ajuste automático). Depende de T-11 (hecha).
2. En paralelo: T-17 (Open-Meteo), T-25 (clima mensual), T-27 (evaluación del
   generador) y T-30 (criterio RLS de la fase a).
3. Evaluar las ideas I-04 (recomendar municipios cuando el usuario no los conoce)
   e I-05 (guardado local sin cuenta, diferido): decidir si entran en una entrega
   futura.
4. Criterios de F-b pendientes de medir: cobertura >= 80 % en domain/itinerario
   (falta el provider `@vitest/coverage-v8`) y generación < 500 ms en móvil.
5. Usuario (cuando quiera): crear `SUPABASE_URL` y `SUPABASE_ANON_KEY` en GitHub
   para la consulta diaria contra la pausa.
6. Antes de la sustentación: reemplazar los iconos placeholder de la PWA por el
   diseño real (fase final); revisar costos/tarifas/tiempos del seed (R-04) y el
   acceso al Nevado del Ruiz (R-03).

## Pendientes de decisión del usuario
- Decidir si las ideas I-04 (recomendar municipios) e I-05 (guardado local sin
  cuenta, diferido) se vuelven tareas en una entrega futura.
- Si se cambia `python3` por `python` en la skill para Windows y se automatiza
  el paso del JSON en PowerShell, o se sigue aplicando con un runner.
- Si se agrega un `.gitattributes` para normalizar los finales de línea a LF.
- Sobre el diseño del producto no hay preguntas abiertas (`plan.md`, sección 10).
