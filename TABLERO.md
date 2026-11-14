# Tablero del proyecto

> Vista generada desde `control/tablero.json` con `python3 .claude/skills/orquestador-proyecto/scripts/tablero.py render`. No se edita a mano.

Revisión 30, actualizado 2026-11-14T08:52:23. Avance: 30/30 tareas (100 %).

## Avance por frente

| Frente | Hechas | Total |
|---|---|---|
| Fase 0: Preparación | 8 | 8 |
| Fase (a): Catálogo + mapa | 6 | 6 |
| Fase (b): Planificador de itinerarios | 5 | 5 |
| Fase (c): Presupuesto | 2 | 2 |
| Fase (d): Clima | 3 | 3 |
| Fase (e): Insignias y perfil | 3 | 3 |
| Fase final: Pulido | 3 | 3 |

## Próxima tarea

Ninguna disponible.

## Ruta crítica

| # | Id | Tarea | Frente | Resp. | Prio. | Estado | Depende de |
|---|---|---|---|---|---|---|---|
| 1 | T-01 | ~~Crear proyecto Vite + React + TS con Tailwind, ESLint/Prettier y Vitest~~ | F-0 | claude | P1 | hecha | - |
| 2 | T-02 | ~~Crear el proyecto en Supabase y .env.example sin secretos~~ | F-0 | usuario | P1 | hecha | - |
| 3 | T-03 | ~~Configurar OAuth de Google (Google Cloud Console + proveedor y Redirect URLs en Supabase; usuarios de prueba)~~ | F-0 | usuario | P1 | hecha | T-02 |
| 4 | T-04 | ~~Crear src/i18n/es-CO.ts y la función t(clave)~~ | F-0 | claude | P2 | hecha | T-01 |
| 5 | T-05 | ~~Inicio y cierre de sesión con Google en la app~~ | F-0 | claude | P2 | hecha | T-01, T-03 |
| 6 | T-06 | ~~Verificar el conteo de municipios con la DIVIPOLA del DANE y verificar rutas temáticas con fuentes oficiales~~ | F-a | claude | P1 | hecha | - |
| 7 | T-07 | ~~Migraciones SQL del catálogo con RLS de solo lectura~~ | F-a | claude | P1 | hecha | T-02 |
| 8 | T-08 | ~~Seed del catálogo (municipios, 40-60 atracciones, casco urbano, rutas de bus, tarifas, rutas temáticas) con validación Zod y scripts/cargar-seed.ts~~ | F-a | claude | P1 | hecha | T-06, T-07 |
| 9 | T-09 | ~~Lista filtrable de municipios y atracciones y ficha de atracción~~ | F-a | claude | P2 | hecha | T-04, T-08 |
| 10 | T-10 | ~~Mapa Leaflet con marcadores agrupados, atribución OSM y caché de teselas (6.5)~~ | F-a | claude | P2 | hecha | T-08 |
| 11 | T-11 | ~~Generador de itinerario (6.1 pasos 1-7) con pruebas unitarias de los casos límite~~ | F-b | claude | P1 | hecha | T-08 |
| 12 | T-12 | ~~Migraciones de datos de usuario (perfiles, viajes, viaje_dias, viaje_items, metas, aportes) con RLS~~ | F-b | claude | P2 | hecha | T-07 |
| 13 | T-13 | ~~Formulario del viaje y vista día por día con edición, subir/bajar e ítems fijados~~ | F-b | claude | P2 | hecha | T-11, T-09 |
| 14 | T-14 | ~~Guardar y listar viajes del usuario (con cuenta) y lectura offline (PWA). El guardado sin cuenta en IndexedDB se difirio (plan.md 1.3, idea I-05)~~ | F-b | claude | P2 | hecha | T-13, T-12, T-05 |
| 15 | T-15 | ~~Presupuesto: desglose (6.2) y modo fijo con ajuste automático (paso 8)~~ | F-c | claude | P2 | hecha | T-11 |
| 16 | T-16 | ~~Modo viaje soñado: meta de ahorro, aportes y barra de progreso~~ | F-c | claude | P3 | hecha | T-15, T-14 |
| 17 | T-17 | ~~Servicio Open-Meteo con Zod, caché de 3 h y respaldo a promedios~~ | F-d | claude | P2 | hecha | T-01 |
| 18 | T-18 | ~~Indicador de clima por día y botón "Reorganizar por clima" con vista previa (paso 9)~~ | F-d | claude | P2 | hecha | T-17, T-15, T-13, T-25 |
| 19 | T-19 | ~~Migraciones de checkins e insignias, RPC registrar_checkin y trigger de insignias, con pruebas RLS~~ | F-e | claude | P2 | hecha | T-12, T-08 |
| 20 | T-20 | ~~Consentimiento de datos, check-in por geolocalización o manual y botón desactivado sin conexión~~ | F-e | claude | P2 | hecha | T-19, T-26 |
| 21 | T-21 | ~~Perfil: mapa de municipios desbloqueados, progreso por departamento y ruta, eliminar cuenta y datos~~ | F-e | claude | P3 | hecha | T-20, T-10 |
| 22 | T-22 | ~~Prueba end-to-end en Playwright del flujo principal~~ | F-final | claude | P3 | hecha | T-21, T-18, T-16 |
| 23 | T-23 | ~~Despliegue con Referrer-Policy y verificación de que Supabase no está pausado antes de la sustentación~~ | F-final | usuario | P3 | hecha | T-22 |

## En paralelo

| # | Id | Tarea | Frente | Resp. | Prio. | Estado | Depende de |
|---|---|---|---|---|---|---|---|
| 1 | T-24 | ~~CI (lint y tests) y workflow diario que consulta Supabase para evitar la pausa~~ | F-0 | claude | P2 | hecha | T-01, T-02 |
| 2 | T-25 | ~~Script reanudable generar-clima-mensual.ts y seed clima_mensual~~ | F-d | claude | P3 | hecha | T-06 |
| 3 | T-26 | ~~Redactar la política de tratamiento de datos (Ley 1581 de 2012)~~ | F-0 | claude | P3 | hecha | - |
| 4 | T-27 | ~~Instancias de evaluación (20-30) e informe: voraz vs. voraz + búsqueda local vs. fuerza bruta~~ | F-b | claude | P2 | hecha | T-11 |
| 5 | T-28 | ~~Accesibilidad, rendimiento en móvil y revisión de textos en español~~ | F-final | claude | P3 | hecha | T-21 |
| 6 | T-29 | ~~Verificar en una sesión de Claude Code que CLAUDE.md y las skills cargan (/context all y /orquestador-proyecto retomar)~~ | F-0 | usuario | P2 | hecha | - |
| 7 | T-30 | ~~Verificar el criterio RLS de la fase (a): un INSERT con la clave publica sobre atracciones falla~~ | F-a | claude | P2 | hecha | T-08 |

## Riesgos

| Id | Riesgo | Impacto | Prob. | Mitigación | Resp. | Estado |
|---|---|---|---|---|---|---|
| R-01 | El plan gratuito de Supabase pausa el proyecto tras 7 días de inactividad | alto | media | Workflow diario con una consulta real (T-24) y verificación antes de la sustentación (T-23) | claude | activo |
| R-02 | Generar clima_mensual puede superar la cuota gratuita de Open-Meteo | medio | media | 5 años, solo variables necesarias, pausas, resultados parciales y ejecución reanudable (T-25) | claude | activo |
| R-03 | El acceso al PNN Los Nevados y al Nevado del Ruiz cambia con el nivel de alerta del SGC | medio | alta | Campos requiere_guia y estado_acceso en el seed. Verificado por el usuario el 2026-11-12: Nevado del Ruiz en nivel Amarillo (SGC) y PNN Los Nevados sin cambios de apertura; atraccion nevado-del-ruiz con estado_acceso restringida, requiere_guia true y nota_acceso con nivel y fecha, cargada en Supabase. Verificado para esta entrega. | usuario | mitigado |
| R-04 | Tarifas y rutas de bus sin fuente verificable o desactualizadas | medio | alta | Solo tramos directos reales con fecha_actualizacion y fuente; costo_aproximado true. Verificado por el usuario el 2026-11-12: rangos de alojamiento, comida, buses y entradas razonables; sin cambios. Verificado para esta entrega. | claude | mitigado |
| R-05 | Con la pantalla de consentimiento de Google en modo Testing, los evaluadores no pueden iniciar sesión | alto | media | Publicar la pantalla o agregar a los evaluadores como usuarios de prueba (T-03) | usuario | activo |
| R-06 | El GPS se puede falsear y una PWA no lo detecta | bajo | media | Limitación aceptada y documentada (plan.md 2.2 y 6.4) | usuario | activo |

## Ideas

| Id | Idea | Origen | Estado |
|---|---|---|---|
| I-01 | Versión posterior: municipios del Valle del Cauca con área en el PCC | plan.md sección 2.3 | nueva |
| I-02 | Itinerarios compartidos o colaborativos | plan.md sección 2.2 | nueva |
| I-03 | Modelo de tarifas por edad y categoria (adulto, nino, adulto mayor, extranjero) y pasaportes por nivel en atracciones como el Parque del Cafe o PANACA. Hoy el esquema usa un unico costo_entrada_cop (tarifa general de adulto) mas tarifa_extranjero_cop, acorde a plan.md 6.2. Implicaria una tabla de tarifas por atraccion y categoria y que el planificador pregunte las edades del grupo; afecta presupuesto (T-15). | Observacion del usuario en T-09 (2026-11-10): el precio del Parque del Cafe depende de la edad | nueva |
| I-04 | Modo no-conozco-los-municipios: recomendar destinos a partir de estilos de viaje y tiempos de bus, preguntando cuantos municipios o dias quiere el usuario, y proponer un itinerario factible. Funcionalidad nueva del planificador, surgida al verificar T-14 (observacion 1.2 del usuario). | Observacion del usuario al verificar T-14 (2026-11-10) | nueva |
| I-05 | Guardado local sin cuenta: generar un itinerario sin iniciar sesion y guardarlo en el dispositivo (IndexedDB), con opcion de subirlo a la cuenta al iniciar sesion (supuesto 1.2.3 original de plan.md). Diferido del MVP en T-14 por alcance: el flujo sin sesion no quedo confiable y se retiro para no retrasar la fase (b). Guardar requiere iniciar sesion con Google. Registrado en plan.md 1.3 y 2.2. | Decision del usuario al cerrar T-14 (2026-11-11) | nueva |

## Alertas

Ninguna.

## Últimos cambios

| Fecha | Por | Operación | Id | Detalle |
|---|---|---|---|---|
| 2026-11-14T08:52:23 | claude | campo | T-23 | estado: 'pendiente' -> 'hecha' |
| 2026-11-14T08:52:23 | claude | nota | T-23 | DESPLEGADA Y VERIFICADA EN PRODUCCION por el usuario el 2026-11-14. El usuario resulto ser admin del repo en GitHub, asi que el bloqueo de permisos de la nota anterior quedo superado: importo el repo en Vercel y desplego normal (sin Vercel CLI). URL publica: https://planificacionviajes-jade.vercel.app/ (ruta de prueba /planificar). Criterios de cierre de T-23, todos verificados por el usuario: (a) la URL carga el catalogo; (b) la cabecera Referrer-Policy devuelve strict-origin-when-cross-origin; (c) recargar en /planificar carga sin 404 (SPA fallback ok); (d) el mapa (teselas OSM) carga en produccion; (e) login con Google funciona en produccion; (f) Supabase Active (no pausado). Config commiteada en 3489c1b (vercel.json). Con esto cierra la fase final (pulido) 3/3 y el proyecto queda 30/30. |
| 2026-11-12T17:11:30 | claude | nota | T-23 | BLOQUEADA DE HECHO por permisos: el repo es de otra cuenta/organizacion y el usuario es solo collaborator; la GitHub App de Vercel (y de Netlify) no lista el repo hasta que el dueno la autorice o le den rol admin. Config lista y commiteada (vercel.json: Referrer-Policy strict-origin-when-cross-origin, SPA fallback, no-cache de sw.js; commit 3489c1b). Alternativa sin GitHub: Vercel CLI (vercel / vercel --prod) subiendo el build local. PASOS para desplegar (Vercel): 1) git push origin dev. 2) Importar el repo en Vercel (o usar la CLI); framework Vite, build npm run build, salida dist. 3) Variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (clave anon). 4) En Supabase Auth URL Configuration: Site URL y Redirect URLs con la URL de Vercel (dejar localhost). 5) En Google Cloud: agregar la URL a origenes JS autorizados; el callback de Supabase no cambia (R-05: usuarios de prueba o publicar la pantalla). 6) Confirmar Supabase Active (no pausado) y el cron Actividad de Supabase en verde. CRITERIOS para dar por finalizada T-23: (a) URL publica carga y redirige a /explorar leyendo el catalogo; (b) curl -sI <url> \| grep referrer-policy devuelve strict-origin-when-cross-origin; (c) recargar en /planificar NO da 404 (SPA fallback); (d) el mapa (teselas OSM) carga en produccion; (e) login con Google funciona en produccion; (f) Supabase Active. El usuario debe pasar la URL y la salida del curl como evidencia. |
| 2026-11-12T17:11:30 | claude | nota | T-22 | Prueba e2e con Playwright 1.65 (chromium). Un unico flujo (e2e/flujo-principal.spec.ts): explorar, planificar y generar, ajustar presupuesto, clima y reorganizar, guardar viaje, check-in geo. Toda la red interceptada con page.route (Supabase REST/RPC y Open-Meteo) usando el seed real; sesion sembrada en localStorage (sb-pruebas-auth-token); context.setGeolocation. playwright.config.ts con webServer build+preview. Vitest excluye e2e; scripts e2e/e2e:ui; job e2e en ci.yml; gitignore y README actualizados. Pasa estable en local y en modo CI. Commit 08bc429. |
| 2026-11-12T17:11:30 | claude | campo | T-22 | estado: 'pendiente' -> 'hecha' |
| 2026-11-12T15:01:52 | claude | campo | R-04 | mitigacion: 'Solo tramos directos reales con fecha_actualizacion y fuente; costo_aproximado = true' -> 'Solo tramos directos reales con fecha_actualizacion y fuente; costo_aproximado true. Verificado por el usuario el 2026-11-12: rangos de alojamiento, comida, buses y entradas razonables; sin cambios. Verificado para esta entrega.' |
| 2026-11-12T15:01:52 | claude | campo | R-04 | estado: 'activo' -> 'mitigado' |
| 2026-11-12T15:01:52 | claude | campo | R-03 | mitigacion: 'Campos requiere_guia y estado_acceso; revisar antes de cada entrega' -> 'Campos requiere_guia y estado_acceso en el seed. Verificado por el usuario el 2026-11-12: Nevado del Ruiz en nivel Amarillo (SGC) y PNN Los Nevados sin cambios de apertura; atraccion nevado-del-ruiz con estado_acceso restringida, requiere_guia true y nota_acceso con nivel y fecha, cargada en Supabase. Verificado para esta entrega.' |
| 2026-11-12T15:01:52 | claude | campo | R-03 | estado: 'activo' -> 'mitigado' |
| 2026-11-12T14:21:08 | claude | nota | T-28 | Accesibilidad, rendimiento y textos. eslint-plugin-jsx-a11y (recommended) en el lint, 0 avisos. Foco visible (:focus-visible color de marca) y prefers-reduced-motion en index.css. Skip link, nav con nombre accesible (nav.principal) y main con id destino. Modales (consentimiento y eliminar cuenta) con hook use-modal-accesible (Escape, foco al abrir, restaurar al cerrar). Contraste: texto informativo slate-400 -> slate-500. Rendimiento: confirmado el code-splitting de Leaflet y la carga diferida de los mapas. Textos es-CO revisados. Prueba de landmarks en App.test. Dep nueva de desarrollo eslint-plugin-jsx-a11y@6.9.0. Commit 28232b8. |
| 2026-11-12T14:21:08 | claude | campo | T-28 | estado: 'pendiente' -> 'hecha' |
| 2026-11-12T14:21:08 | claude | nota | T-21 | Pantalla /perfil (requiere sesion): mapa Leaflet lazy con los 53 municipios (visitados resaltados), progreso del Eje/por departamento/por ruta con barras accesibles, insignias obtenidas distinguiendo verificadas de manuales, y eliminar cuenta. Dominio puro src/domain/insignias/progreso (refleja el trigger; 11 pruebas). Lecturas nuevas del catalogo: rutas_tematicas y ruta_items. i18n: tTexto() para clave_texto sin exigir params. Migracion 20261112140000_eliminar_cuenta (RPC eliminar_mi_cuenta SECURITY DEFINER borra auth.users; CASCADE arrastra perfiles, viajes y sus hijos, checkins e insignias) aplicada; prueba supabase/tests/eliminar_cuenta.sql verde (cascada completa sin tocar a otros ni al catalogo). La eliminacion real NO se ejecuto (destructiva): queda para verificacion del usuario con una cuenta de prueba. Cierra la fase (e). Commit 20c7576. |
| 2026-11-12T14:21:08 | claude | campo | T-21 | estado: 'pendiente' -> 'hecha' |
| 2026-11-12T14:21:08 | claude | nota | T-20 | Consentimiento + check-in geo/manual + boton offline, en la ficha de atraccion. Modal de consentimiento (feature privacidad) antes del primer check-in, guarda perfiles.consentimiento_datos_en (upsert); enlace a la politica (copiada a public/). Check-in por geolocalizacion (getCurrentPosition maximumAge:0) -> RPC registrar_checkin; registro manual via p_manual=true (no verificado, sin coordenadas; reemplazo el truco de precision). Boton desactivado sin conexion (hook use-conexion con navigator.onLine). Primer uso de supabase.rpc() en el cliente; respuestas validadas con Zod (domain/insignias/esquemas). Util de geolocalizacion con errores tipados (incluye contexto_inseguro) y mensaje que invita al registro manual. Prueba SQL ampliada (manual no verificado). Flujo geo verificado en Firefox (en Chromium Linux el NetworkLocationProvider falla; el manual cubre ese caso). Commit 01a3ed7. |
| 2026-11-12T14:21:08 | claude | campo | T-20 | estado: 'pendiente' -> 'hecha' |
