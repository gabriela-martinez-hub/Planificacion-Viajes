# Informe de evaluación del generador de itinerarios (T-27)

> Generado por `scripts/evaluar-generador.ts`. No se edita a mano: vuelve a correr `npm run evaluar` para actualizarlo.

Fecha de generación: 2026-11-12

## Qué se evalúa

Se comparan tres estrategias sobre el mismo banco de instancias (`casos.ts`), con la función objetivo y el verificador de restricciones de `objetivo.ts` (plan.md 6.0):

- **voraz**: solo la construcción voraz (`generador.ts`, pasos 1-6).
- **voraz+local**: voraz seguida de búsqueda local por ascenso de colina (`index.ts`, paso 7).
- **fuerza bruta**: óptimo exacto por enumeración, solo en instancias con ≤ 8 atracciones candidatas (`fuerza-bruta.ts`).

El objetivo (a maximizar) es `Σ puntuación(a) − λ · minutos_traslado − μ · penalización_lluvia`. La brecha de optimalidad es `(óptimo − objetivo_voraz_local) / |óptimo|`.

## Resumen

- Instancias evaluadas: **24**.
- Instancias con alguna violación de restricciones: **0** (el criterio de la fase b exige 0).
- Instancias pequeñas comparadas contra el óptimo exacto: **14**; de ellas, **12** alcanzan el óptimo.
- Instancias donde la búsqueda local mejora el objetivo: **1**.
- Mayor diferencia absoluta de objetivo frente al óptimo: **48.00** puntos.
- Instancias pequeñas por debajo del óptimo (2):
  - `sint-05-jornada-apretada`: objetivo 2.00 vs óptimo 3.00 (diferencia 1.00).
  - `sint-11-lluvia-un-dia`: objetivo -45.00 vs óptimo 3.00 (diferencia 48.00).
- Tiempo de generación (voraz+local): promedio **0.11 ms**, máximo **0.43 ms** (criterio: < 500 ms).

> Se reporta el **número de instancias en el óptimo** en vez de un promedio de brechas porcentuales: cuando el objetivo óptimo es pequeño en magnitud (dominado por el término de penalización por lluvia o por traslados largos), el porcentaje se dispara y deja de ser informativo. La columna "Brecha" de la tabla se mantiene como referencia por instancia.

> Nota: los tiempos se miden en el entorno de ejecución de las pruebas, no en un móvil de gama media. Sirven como cota optimista; el margen respecto a 500 ms es amplio.

## Resultados por instancia

| Instancia | Obj. voraz | Obj. voraz+local | Óptimo (FB) | Brecha | Viol. | Costo total (voraz+local) | t (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
| sint-01-un-dia-un-municipio | 3.10 | 3.10 | 3.10 | 0.0 % | 0 | 180.000 | 0.26 |
| sint-02-un-dia-estilo-aventura | 4.10 | 4.10 | 4.10 | 0.0 % | 0 | 180.000 | 0.12 |
| sint-03-dos-dias-un-municipio | 3.10 | 3.10 | 3.10 | 0.0 % | 0 | 360.000 | 0.05 |
| sint-04-dos-municipios-origen-externo | -276.00 | -276.00 | -276.00 | 0.0 % | 0 | 512.000 | 0.07 |
| sint-05-jornada-apretada | 2.00 | 2.00 | 3.00 | 33.3 % | 0 | 180.000 | 0.02 |
| sint-06-jornada-apretada-dos-dias | 5.00 | 5.00 | 5.00 | 0.0 % | 0 | 360.000 | 0.05 |
| sint-07-cierre-lunes | 1.00 | 1.00 | 1.00 | 0.0 % | 0 | 180.000 | 0.01 |
| sint-08-cierre-no-aplica-sabado | 2.00 | 2.00 | 2.00 | 0.0 % | 0 | 180.000 | 0.01 |
| sint-09-acceso-cerrado-excluido | 4.00 | 4.00 | 4.00 | 0.0 % | 0 | 360.000 | 0.02 |
| sint-10-obligatoria | -276.00 | -276.00 | -276.00 | 0.0 % | 0 | 512.000 | 0.04 |
| sint-11-lluvia-un-dia | -45.00 | -45.00 | 3.00 | 1600.0 % | 0 | 360.000 | 0.14 |
| sint-12-origen-igual-destino | 4.10 | 4.10 | 4.10 | 0.0 % | 0 | 540.000 | 0.06 |
| sint-13-restringida-permitida | 3.00 | 3.00 | 3.00 | 0.0 % | 0 | 180.000 | 0.01 |
| sint-14-regreso-largo | -240.00 | -240.00 | -240.00 | 0.0 % | 0 | 500.000 | 0.03 |
| sint-15-infactible-un-dia-externo-regreso | — | — | — | — | 0 | infactible | 0.01 |
| sint-16-infactible-sin-municipios | — | — | — | — | 0 | infactible | 0.00 |
| seed-17-salento-naturaleza | -86.90 | -86.90 | — | — | 0 | 464.000 | 0.15 |
| seed-18-eje-cafetero-cultura | -66.70 | -66.70 | — | — | 0 | 598.000 | 0.22 |
| seed-19-manizales-aventura | 3.20 | 3.20 | — | — | 0 | 610.000 | 0.10 |
| seed-20-pereira-descanso | -30.80 | -30.80 | — | — | 0 | 896.000 | 0.10 |
| seed-21-bogota-traslado-largo | -478.90 | -478.90 | — | — | 0 | 790.000 | 0.22 |
| seed-22-lluvia-reorganiza | -185.90 | -85.90 | — | — | 0 | 624.000 | 0.31 |
| seed-23-nivel-alto | -89.80 | -89.80 | — | — | 0 | 1.573.000 | 0.43 |
| seed-24-seis-dias-varios | -48.70 | -48.70 | — | — | 0 | 1.207.000 | 0.21 |

## Descripción de las instancias

- **sint-01-un-dia-un-municipio**: Un día, un municipio, sin estilos preferidos. _(apta para fuerza bruta)_
- **sint-02-un-dia-estilo-aventura**: Un día priorizando aventura. _(apta para fuerza bruta)_
- **sint-03-dos-dias-un-municipio**: Dos días en un municipio: reparte las 3 atracciones. _(apta para fuerza bruta)_
- **sint-04-dos-municipios-origen-externo**: Dos municipios, origen externo, 3 días con regreso. _(apta para fuerza bruta)_
- **sint-05-jornada-apretada**: Atracción de 450 min: no todo cabe en un día. _(apta para fuerza bruta)_
- **sint-06-jornada-apretada-dos-dias**: Dos días para repartir atracciones largas. _(apta para fuerza bruta)_
- **sint-07-cierre-lunes**: Un lunes: la atracción que cierra lunes no entra. _(apta para fuerza bruta)_
- **sint-08-cierre-no-aplica-sabado**: Un sábado: ambas atracciones pueden entrar. _(apta para fuerza bruta)_
- **sint-09-acceso-cerrado-excluido**: La atracción cerrada no debe entrar si no es obligatoria. _(apta para fuerza bruta)_
- **sint-10-obligatoria**: Fuerza una atracción concreta como obligatoria. _(apta para fuerza bruta)_
- **sint-11-lluvia-un-dia**: Día lluvioso con atracciones al aire libre (penalización). _(apta para fuerza bruta)_
- **sint-12-origen-igual-destino**: Origen = municipio base, sin traslado de llegada. _(apta para fuerza bruta)_
- **sint-13-restringida-permitida**: La restringida sí puede entrar (solo la cerrada se excluye). _(apta para fuerza bruta)_
- **sint-14-regreso-largo**: Regreso a ciudad externa; el último día es de solo traslado. _(apta para fuerza bruta)_
- **sint-15-infactible-un-dia-externo-regreso**: Un día desde ciudad externa con regreso: infactible. _(caso infactible esperado)_
- **sint-16-infactible-sin-municipios**: Sin municipios elegidos: falla. _(caso infactible esperado)_
- **seed-17-salento-naturaleza**: Seed real: Salento, 3 días, naturaleza, con regreso.
- **seed-18-eje-cafetero-cultura**: Seed real: varios municipios del Quindío, cultura cafetera.
- **seed-19-manizales-aventura**: Seed real: Manizales y alrededores, aventura.
- **seed-20-pereira-descanso**: Seed real: Pereira y Santa Rosa, descanso.
- **seed-21-bogota-traslado-largo**: Seed real: origen Bogotá (traslado largo), 4 días.
- **seed-22-lluvia-reorganiza**: Seed real: con días lluviosos para ejercitar la búsqueda local.
- **seed-23-nivel-alto**: Seed real: mismo viaje a nivel alto (costos mayores).
- **seed-24-seis-dias-varios**: Seed real: 6 días, cuatro municipios, todos los estilos.

## Conclusiones

- El generador no produce **ninguna** violación de restricciones (0 de 24), cumpliendo el criterio de la fase b.
- En 12 de 14 instancias pequeñas la heurística alcanza el óptimo exacto. La heurística nunca supera al óptimo (una brecha negativa indicaría un error del modelo).
- Las brechas no nulas tienen dos causas identificadas y esperables para una construcción voraz:
  1. **Elección voraz local** (p. ej. `sint-05`): el voraz toma una atracción de alta puntuación que satura la jornada, cuando dos atracciones más cortas habrían sumado más puntuación. Es la limitación clásica de una heurística voraz con restricción de capacidad.
  2. **La búsqueda local no descarta actividades** (p. ej. `sint-11`): sus movimientos reubican actividades al aire libre a días secos, pero si el día seco no tiene cupo, la actividad se queda bajo la lluvia; el óptimo, en cambio, prefiere no incluirla. Quitar actividades para reducir la penalización por lluvia no es un movimiento de la búsqueda local actual.
- La búsqueda local nunca empeora el objetivo y lo mejora en los casos con clima lluvioso donde sí hay cupo en un día seco (reubica respetando el límite de jornada, corrección introducida en esta tarea).

