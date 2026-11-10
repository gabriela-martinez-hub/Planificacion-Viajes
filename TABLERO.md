# Tablero del proyecto

> Vista generada desde `control/tablero.json` con `python3 .claude/skills/orquestador-proyecto/scripts/tablero.py render`. No se edita a mano.

Revisión 11, actualizado 2026-11-09T21:29:46. Avance: 9/29 tareas (31 %).

## Avance por frente

| Frente | Hechas | Total |
|---|---|---|
| Fase 0: Preparación | 7 | 8 |
| Fase (a): Catálogo + mapa | 2 | 5 |
| Fase (b): Planificador de itinerarios | 0 | 5 |
| Fase (c): Presupuesto | 0 | 2 |
| Fase (d): Clima | 0 | 3 |
| Fase (e): Insignias y perfil | 0 | 3 |
| Fase final: Pulido | 0 | 3 |

## Próxima tarea

**T-08** Seed del catálogo (municipios, 40-60 atracciones, casco urbano, rutas de bus, tarifas, rutas temáticas) con validación Zod y scripts/cargar-seed.ts (claude)

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
| 8 | T-08 | Seed del catálogo (municipios, 40-60 atracciones, casco urbano, rutas de bus, tarifas, rutas temáticas) con validación Zod y scripts/cargar-seed.ts | F-a | claude | P1 | pendiente | T-06, T-07 |
| 9 | T-09 | Lista filtrable de municipios y atracciones y ficha de atracción | F-a | claude | P2 | pendiente | T-04, T-08 |
| 10 | T-10 | Mapa Leaflet con marcadores agrupados, atribución OSM y caché de teselas (6.5) | F-a | claude | P2 | pendiente | T-08 |
| 11 | T-11 | Generador de itinerario (6.1 pasos 1-7) con pruebas unitarias de los casos límite | F-b | claude | P1 | pendiente | T-08 |
| 12 | T-12 | Migraciones de datos de usuario (perfiles, viajes, viaje_dias, viaje_items, metas, aportes) con RLS | F-b | claude | P2 | pendiente | T-07 |
| 13 | T-13 | Formulario del viaje y vista día por día con edición, subir/bajar e ítems fijados | F-b | claude | P2 | pendiente | T-11, T-09 |
| 14 | T-14 | Guardar y listar viajes, lectura offline (PWA) e itinerarios sin cuenta en IndexedDB | F-b | claude | P2 | pendiente | T-13, T-12, T-05 |
| 15 | T-15 | Presupuesto: desglose (6.2) y modo fijo con ajuste automático (paso 8) | F-c | claude | P2 | pendiente | T-11 |
| 16 | T-16 | Modo viaje soñado: meta de ahorro, aportes y barra de progreso | F-c | claude | P3 | pendiente | T-15, T-14 |
| 17 | T-17 | Servicio Open-Meteo con Zod, caché de 3 h y respaldo a promedios | F-d | claude | P2 | pendiente | T-01 |
| 18 | T-18 | Indicador de clima por día y botón "Reorganizar por clima" con vista previa (paso 9) | F-d | claude | P2 | pendiente | T-17, T-15, T-13, T-25 |
| 19 | T-19 | Migraciones de checkins e insignias, RPC registrar_checkin y trigger de insignias, con pruebas RLS | F-e | claude | P2 | pendiente | T-12, T-08 |
| 20 | T-20 | Consentimiento de datos, check-in por geolocalización o manual y botón desactivado sin conexión | F-e | claude | P2 | pendiente | T-19, T-26 |
| 21 | T-21 | Perfil: mapa de municipios desbloqueados, progreso por departamento y ruta, eliminar cuenta y datos | F-e | claude | P3 | pendiente | T-20, T-10 |
| 22 | T-22 | Prueba end-to-end en Playwright del flujo principal | F-final | claude | P3 | pendiente | T-21, T-18, T-16 |
| 23 | T-23 | Despliegue con Referrer-Policy y verificación de que Supabase no está pausado antes de la sustentación | F-final | usuario | P3 | pendiente | T-22 |

## En paralelo

| # | Id | Tarea | Frente | Resp. | Prio. | Estado | Depende de |
|---|---|---|---|---|---|---|---|
| 1 | T-24 | ~~CI (lint y tests) y workflow diario que consulta Supabase para evitar la pausa~~ | F-0 | claude | P2 | hecha | T-01, T-02 |
| 2 | T-25 | Script reanudable generar-clima-mensual.ts y seed clima_mensual | F-d | claude | P3 | pendiente | T-06 |
| 3 | T-26 | ~~Redactar la política de tratamiento de datos (Ley 1581 de 2012)~~ | F-0 | claude | P3 | hecha | - |
| 4 | T-27 | Instancias de evaluación (20-30) e informe: voraz vs. voraz + búsqueda local vs. fuerza bruta | F-b | claude | P2 | pendiente | T-11 |
| 5 | T-28 | Accesibilidad, rendimiento en móvil y revisión de textos en español | F-final | claude | P3 | pendiente | T-21 |
| 6 | T-29 | Verificar en una sesión de Claude Code que CLAUDE.md y las skills cargan (/context all y /orquestador-proyecto retomar) | F-0 | usuario | P2 | pendiente | - |

## Riesgos

| Id | Riesgo | Impacto | Prob. | Mitigación | Resp. | Estado |
|---|---|---|---|---|---|---|
| R-01 | El plan gratuito de Supabase pausa el proyecto tras 7 días de inactividad | alto | media | Workflow diario con una consulta real (T-24) y verificación antes de la sustentación (T-23) | claude | activo |
| R-02 | Generar clima_mensual puede superar la cuota gratuita de Open-Meteo | medio | media | 5 años, solo variables necesarias, pausas, resultados parciales y ejecución reanudable (T-25) | claude | activo |
| R-03 | El acceso al PNN Los Nevados y al Nevado del Ruiz cambia con el nivel de alerta del SGC | medio | alta | Campos requiere_guia y estado_acceso; revisar antes de cada entrega | usuario | activo |
| R-04 | Tarifas y rutas de bus sin fuente verificable o desactualizadas | medio | alta | Solo tramos directos reales con fecha_actualizacion y fuente; costo_aproximado = true | claude | activo |
| R-05 | Con la pantalla de consentimiento de Google en modo Testing, los evaluadores no pueden iniciar sesión | alto | media | Publicar la pantalla o agregar a los evaluadores como usuarios de prueba (T-03) | usuario | activo |
| R-06 | El GPS se puede falsear y una PWA no lo detecta | bajo | media | Limitación aceptada y documentada (plan.md 2.2 y 6.4) | usuario | activo |

## Ideas

| Id | Idea | Origen | Estado |
|---|---|---|---|
| I-01 | Versión posterior: municipios del Valle del Cauca con área en el PCC | plan.md sección 2.3 | nueva |
| I-02 | Itinerarios compartidos o colaborativos | plan.md sección 2.2 | nueva |

## Alertas

Ninguna.

## Últimos cambios

| Fecha | Por | Operación | Id | Detalle |
|---|---|---|---|---|
| 2026-11-09T21:29:46 | claude | nota | T-07 | El usuario aplico la migracion del catalogo en el proyecto Supabase (2026-11-09). T-07 completa: codigo en el repo (c48fe44) y esquema con RLS aplicado en la base |
| 2026-11-09T21:25:34 | claude | nota | T-24 | CI en verde en GitHub Actions. La consulta diaria a Supabase se salta sola mientras no exista la variable SUPABASE_URL en GitHub; se activa cuando el usuario cree esa variable y el secreto SUPABASE_ANON_KEY tras aplicar T-07. Se da por hecha la parte de CI; la activacion de la consulta queda cubierta por T-23 (verificacion antes de la sustentacion) |
| 2026-11-09T21:25:34 | claude | campo | T-24 | estado: 'en_curso' -> 'hecha' |
| 2026-11-09T21:25:34 | claude | nota | T-05 | Commit 58eefab: cliente Supabase (src/services/supabase.ts) con anon key, config validada con Zod (src/lib/config.ts), AuthProvider y contexto de sesion (src/features/auth), BotonAuth con textos de auth.* del i18n. Dependencias @supabase/supabase-js@2.45.4 y zod@3.23.8. El usuario verifico login y logout con Google en el navegador (2026-11-09). lint 0, 2/2 pruebas, build ok |
| 2026-11-09T21:25:34 | claude | campo | T-05 | estado: 'pendiente' -> 'hecha' |
| 2026-11-09T21:25:34 | claude | nota | T-03 | El usuario configuro Google Cloud (pantalla de consentimiento en Testing, credenciales OAuth web, usuarios de prueba) y el proveedor Google y las Redirect URLs en Supabase (2026-11-09) |
| 2026-11-09T21:25:34 | claude | campo | T-03 | estado: 'pendiente' -> 'hecha' |
| 2026-11-09T21:25:34 | claude | nota | T-07 | Migracion supabase/migrations/20261109210000_catalogo.sql (commit c48fe44): todas las tablas del catalogo (plan.md 5.1) con RLS de solo lectura (5.3), politica unica FOR SELECT y revoke de insert/update/delete/truncate a anon y authenticated. El tablero la tenia como pendiente; se reconcilia con el repo. Pendiente del usuario: aplicarla en el proyecto Supabase (SQL Editor o supabase db push) |
| 2026-11-09T21:25:34 | claude | campo | T-07 | estado: 'pendiente' -> 'hecha' |
| 2026-11-09T20:43:01 | claude | nota | T-29 | El usuario decidio dejarla para mas adelante (2026-11-09) |
| 2026-11-09T20:43:01 | claude | nota | T-26 | Version academica aprobada por el usuario el 2026-11-09 (sin usuarios publicos; solo equipo y evaluadores). Si se abre al publico se reemplaza por una politica completa segun la Ley 1581 |
| 2026-11-09T20:43:01 | claude | campo | T-26 | estado: 'en_curso' -> 'hecha' |
| 2026-11-09T20:27:06 | claude | nota | T-24 | CI en verde en GitHub Actions (confirmado por el usuario el 2026-11-09). Solo falta activar la consulta diaria tras T-07 |
| 2026-11-09T20:24:28 | claude | nota | T-24 | Push hecho el 2026-11-09; falta confirmar que la CI salió en verde en GitHub Actions. Frecuencia diaria aprobada por el usuario y aplicada en plan.md |
| 2026-11-09T20:24:28 | claude | campo | R-01 | mitigacion: 'Workflow semanal con una consulta real (T-24) y verificación antes de la sustentación (T-23)' -> 'Workflow diario con una consulta real (T-24) y verificación antes de la sustentación (T-23)' |
