# Tablero del proyecto

> Vista generada desde `control/tablero.json` con `python3 .claude/skills/orquestador-proyecto/scripts/tablero.py render`. No se edita a mano.

Revisión 24, actualizado 2026-11-11T20:59:05. Avance: 18/30 tareas (60 %).

## Avance por frente

| Frente | Hechas | Total |
|---|---|---|
| Fase 0: Preparación | 7 | 8 |
| Fase (a): Catálogo + mapa | 5 | 6 |
| Fase (b): Planificador de itinerarios | 4 | 5 |
| Fase (c): Presupuesto | 2 | 2 |
| Fase (d): Clima | 0 | 3 |
| Fase (e): Insignias y perfil | 0 | 3 |
| Fase final: Pulido | 0 | 3 |

## Próxima tarea

**T-17** Servicio Open-Meteo con Zod, caché de 3 h y respaldo a promedios (claude)

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
| 7 | T-30 | Verificar el criterio RLS de la fase (a): un INSERT con la clave publica sobre atracciones falla | F-a | claude | P2 | pendiente | T-08 |

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
| I-03 | Modelo de tarifas por edad y categoria (adulto, nino, adulto mayor, extranjero) y pasaportes por nivel en atracciones como el Parque del Cafe o PANACA. Hoy el esquema usa un unico costo_entrada_cop (tarifa general de adulto) mas tarifa_extranjero_cop, acorde a plan.md 6.2. Implicaria una tabla de tarifas por atraccion y categoria y que el planificador pregunte las edades del grupo; afecta presupuesto (T-15). | Observacion del usuario en T-09 (2026-11-10): el precio del Parque del Cafe depende de la edad | nueva |
| I-04 | Modo no-conozco-los-municipios: recomendar destinos a partir de estilos de viaje y tiempos de bus, preguntando cuantos municipios o dias quiere el usuario, y proponer un itinerario factible. Funcionalidad nueva del planificador, surgida al verificar T-14 (observacion 1.2 del usuario). | Observacion del usuario al verificar T-14 (2026-11-10) | nueva |
| I-05 | Guardado local sin cuenta: generar un itinerario sin iniciar sesion y guardarlo en el dispositivo (IndexedDB), con opcion de subirlo a la cuenta al iniciar sesion (supuesto 1.2.3 original de plan.md). Diferido del MVP en T-14 por alcance: el flujo sin sesion no quedo confiable y se retiro para no retrasar la fase (b). Guardar requiere iniciar sesion con Google. Registrado en plan.md 1.3 y 2.2. | Decision del usuario al cerrar T-14 (2026-11-11) | nueva |

## Alertas

Ninguna.

## Últimos cambios

| Fecha | Por | Operación | Id | Detalle |
|---|---|---|---|---|
| 2026-11-11T20:59:05 | claude | nota | T-16 | T-16 terminada; cierra la fase (c). Dominio puro src/domain/presupuesto/ahorro.ts: calcularAhorro implementa plan.md 6.2 modo sonado (periodos = semanas o meses completos entre hoy y fecha_inicio; cuota = max(0, ceil((meta - ahorrado) / max(1, periodos)))), con estados activa/cumplida (ahorrado >= meta)/vencida (fecha_inicio <= hoy), sin dividir por cero ni cuota negativa; no lee el reloj (recibe hoy). totalAportado suma aportes. Helpers de fechas nuevos en itinerario/fechas.ts: semanasEntre, mesesEntre. Persistencia: services/metas-ahorro.ts (guardar/leer meta con upsert una por viaje; listar/registrar aportes) sobre las tablas metas_ahorro y aportes_ahorro de T-12 con RLS; hooks use-metas-ahorro.ts (TanStack Query). UI PanelMetaAhorro.tsx montada en el detalle de Mis viajes (necesita viaje_id): formulario de meta con objetivo prellenado al total y frecuencia, barra de progreso accesible, cuota sugerida, registro de aportes y estados cumplida/vencida. Pruebas ahorro.test.ts (10): cuota mensual y semanal, la cuota baja al aportar, nunca negativa, sin dividir por cero con menos de un periodo, meta cumplida, vencida (pasada y hoy), progreso acotado. tsc 0, lint 0, format limpio, build ok, 84/84 pruebas. El usuario dio el aval del funcionamiento en el navegador. |
| 2026-11-11T20:59:05 | claude | campo | T-16 | estado: 'pendiente' -> 'hecha' |
| 2026-11-11T20:44:50 | claude | nota | T-15 | T-15 terminada. Dominio puro en src/domain/presupuesto/: tipos.ts, desglose.ts (total y por persona, 6.2), ajustar.ts (paso 8: baja alojamiento y luego comida escalon a escalon, despues poda actividades no obligatorias por puntuacion/costo con desempate por id, parando apenas total <= monto; si ni el economico sin actividades alcanza devuelve ok:false con minimoCop; las obligatorias nunca se quitan), index.ts. Determinista: misma entrada y monto, mismo resultado. UI PanelPresupuesto.tsx conectada al planificador (desglose, campo de monto, boton Ajustar a mi presupuesto, mensajes ajustado/no alcanza), reutiliza formatearCOP. armar-entrada.ts admite ordenMunicipios para que el ajuste regenere con la misma ruta. Pruebas en ajustar.test.ts (9, con el seed real): ya cumple no ajusta, factible nunca supera el monto, baja nivel antes de podar, poda cuando el economico no basta, obligatorias no se quitan, no factible devuelve el minimo sin marcar ajustado, determinismo, desglose por persona, 0 noches sin dividir por cero. tsc 0, lint 0, format limpio, build ok (PWA incluida), 74/74 pruebas. El modo sonado (meta de ahorro y aportes) es T-16 y se apoya en estos calculos. Falta verificar el panel en el navegador. |
| 2026-11-11T20:44:50 | claude | campo | T-15 | estado: 'pendiente' -> 'hecha' |
| 2026-11-11T20:17:56 | claude | idea_agregar | I-05 | Guardado local sin cuenta: generar un itinerario sin iniciar sesion y guardarlo en el dispositivo (IndexedDB), con opcion de subirlo a la cuenta al iniciar sesion (supuesto 1.2.3 original de plan.md). Diferido del MVP en T-14 por alcance: el flujo sin sesion no quedo confiable y se retiro para no retrasar la fase (b). Guardar requiere iniciar sesion con Google. Registrado en plan.md 1.3 y 2.2. |
| 2026-11-11T20:17:56 | claude | nota | T-14 | T-14 cerrada con alcance ajustado. Pieza A (guardar/listar con cuenta) y pieza C (PWA offline) hechas y verificadas por el usuario en el navegador. Pieza B (guardado local sin cuenta en IndexedDB) retirada del MVP y diferida a futuras entregas por alcance (plan.md 1.3 y 2.2; idea I-05). Se intento y el flujo sin sesion no quedo confiable. Bug encontrado: el itinerario se perdia al iniciar sesion (el login OAuth recarga la pagina); resuelto con viaje-pendiente.ts (sessionStorage) como puente efimero durante el login, no IndexedDB. PWA con vite-plugin-pwa 0.20.5: manifest con iconos placeholder, SW autoUpdate, runtimeCaching de teselas OSM (CacheFirst) y REST de Supabase (NetworkFirst), navigateFallback al shell. Eliminados borrador-local.ts/.test.ts y use-borrador.ts; quitadas deps idb y fake-indexeddb. lint 0, format ok, 65/65 pruebas, build genera sw.js. plan.md actualizado en esta sesion. |
| 2026-11-11T20:17:56 | claude | campo | T-14 | titulo: 'Guardar y listar viajes, lectura offline (PWA) e itinerarios sin cuenta en IndexedDB' -> 'Guardar y listar viajes del usuario (con cuenta) y lectura offline (PWA). El guardado sin cuenta en IndexedDB se difirio (plan.md 1.3, idea I-05)' |
| 2026-11-11T20:17:56 | claude | campo | T-14 | estado: 'en_curso' -> 'hecha' |
| 2026-11-10T16:46:23 | claude | idea_agregar | I-04 | Modo no-conozco-los-municipios: recomendar destinos a partir de estilos de viaje y tiempos de bus, preguntando cuantos municipios o dias quiere el usuario, y proponer un itinerario factible. Funcionalidad nueva del planificador, surgida al verificar T-14 (observacion 1.2 del usuario). |
| 2026-11-10T16:46:23 | claude | nota | T-14 | Piezas A (guardar/listar con cuenta) y B (sin cuenta en IndexedDB con idb) en codigo y verificadas por tests (persistir, borrador con fake-indexeddb). Commit a3e888e. Bugs corregidos: guardarViaje no enviaba usuario_id (RLS lo exige); flujo de login a cuenta (ahora guarda borrador antes de redirigir y vuelve a /planificar). PENDIENTE del usuario en Supabase: agregar Redirect URL http://localhost:5173/planificar o comodin http://localhost:5173/** . Falta: re-verificar A y B en el navegador y hacer la pieza C (PWA offline + cache de teselas, iconos placeholder). Idea I-04 (recomendar municipios) para despues. |
| 2026-11-10T16:46:23 | claude | campo | T-14 | estado: 'pendiente' -> 'en_curso' |
| 2026-11-10T15:28:07 | claude | nota | T-13 | Planificador en src/features/planificador (Planificador, SelectorMunicipios, VistaItinerario) y esquemas Zod de viaje en src/domain/viaje. React Router instalado (react-router-dom@6.26.2): rutas /explorar y /planificar. Formulario con validacion Zod (sin fechas en el pasado), boton Todos en estilos, generacion con el dominio T-11, vista dia por dia editable (subir/bajar y fijar actividades; traslados fijos con candado), reorden de destinos con aviso de orden no optimo (EntradaItinerario.ordenMunicipios). Bug de reparto del generador corregido: reparte atracciones entre dias con la misma base (caso Parque del Cafe). Todo en memoria; persistir es T-14. tsc 0, lint 0, build ok, 60/60 pruebas. El usuario verifico la pantalla en el navegador (2026-11-10). |
| 2026-11-10T15:28:07 | claude | campo | T-13 | estado: 'pendiente' -> 'hecha' |
| 2026-11-10T11:49:41 | claude | campo | T-12 | estado: 'pendiente' -> 'hecha' |
| 2026-11-10T11:29:06 | claude | campo | T-11 | estado: 'pendiente' -> 'hecha' |
