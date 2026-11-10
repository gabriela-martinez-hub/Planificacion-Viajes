// Promedios climáticos mensuales por municipio (plan.md 5.1, 6.3).
//
// Este seed NO incluye datos de clima: los genera la tarea T-25 con el script
// reanudable `scripts/generar-clima-mensual.ts`, que consulta la API histórica
// de Open-Meteo respetando su cuota (plan.md 6.3, riesgo R-02). Inventar aquí
// promedios sin fuente contradiría el principio de datos verificables del plan.
//
// Mientras T-25 no se ejecute, la app usa el pronóstico de Open-Meteo para
// fechas dentro de los próximos 16 días; para fechas más lejanas, la ausencia
// de promedios se maneja como un estado de respaldo (fase d, T-17/T-18).
import type { ClimaMensual } from '../../../src/domain/catalogo/esquemas';

export const climaMensual: ClimaMensual[] = [];
