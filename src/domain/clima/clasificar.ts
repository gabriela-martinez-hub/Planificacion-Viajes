// Clasificación de días como lluviosos o secos (plan.md 6.3).
//
// Funciones puras: no leen la red ni la hora del sistema. Reciben el pronóstico
// (si lo hay), los promedios mensuales y la fecha de hoy como parámetros.
//
// Regla de selección de fuente por día (plan.md 6.3):
//   - Días 1-7 desde hoy con pronóstico: 'pronostico'.
//   - Días 8-16 desde hoy con pronóstico: 'tendencia'.
//   - Días más allá de 16 (o sin pronóstico): 'promedio' del seed.
// Si no hay ni pronóstico ni promedio para un día, se trata como seco con
// probabilidad 0 (el día no penaliza; la UI puede avisar que no hay dato).

import type { ClimaMensual } from '../catalogo/esquemas';
import {
  UMBRALES_POR_DEFECTO,
  type ClimaDiaDetalle,
  type PronosticoDia,
  type UmbralesLluvia,
} from './tipos';

/** Días calendario entre dos fechas 'AAAA-MM-DD' (hasta − desde), puede ser negativo. */
function diasDesde(desde: string, hasta: string): number {
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${hasta}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Mes (1-12) de una fecha 'AAAA-MM-DD'. */
function mesDe(fecha: string): number {
  return Number(fecha.slice(5, 7));
}

/** Horizonte del pronóstico de Open-Meteo: 16 días desde hoy (plan.md 6.3). */
export const HORIZONTE_PRONOSTICO_DIAS = 16;
/** Los días 1-7 son pronóstico fiable; 8-16 son "tendencia". */
export const HORIZONTE_FIABLE_DIAS = 7;

/** true si la precipitación o probabilidad superan los umbrales (pronóstico). */
export function esLluviosoPronostico(
  dia: PronosticoDia,
  umbrales: UmbralesLluvia = UMBRALES_POR_DEFECTO,
): boolean {
  const prob = dia.probabilidadPct / 100;
  return (
    prob >= umbrales.probabilidadMin ||
    dia.precipitacionMm >= umbrales.precipitacionMinMm
  );
}

/** true si la probabilidad del promedio mensual supera el umbral (plan.md 6.3). */
export function esLluviosoPromedio(
  clima: ClimaMensual,
  umbrales: UmbralesLluvia = UMBRALES_POR_DEFECTO,
): boolean {
  return clima.prob_lluvia >= umbrales.probabilidadMin;
}

export interface EntradaClasificacion {
  /** Fechas del viaje, 'AAAA-MM-DD', en orden. */
  fechas: string[];
  /** Fecha de hoy 'AAAA-MM-DD' (zona America/Bogota), para el horizonte. */
  hoy: string;
  /** Pronóstico por fecha (de Open-Meteo). Puede estar vacío si falló la red. */
  pronostico: PronosticoDia[];
  /** Promedios mensuales del municipio (12 filas idealmente). Puede faltar. */
  promedioMensual: ClimaMensual[];
  umbrales?: UmbralesLluvia;
}

/**
 * Clasifica cada fecha del viaje combinando pronóstico y promedios, eligiendo
 * la fuente según el horizonte. Devuelve un ClimaDiaDetalle por fecha, en el
 * mismo orden que `fechas`.
 */
export function clasificarDias(
  entrada: EntradaClasificacion,
): ClimaDiaDetalle[] {
  const umbrales = entrada.umbrales ?? UMBRALES_POR_DEFECTO;
  const pronosticoPorFecha = new Map(
    entrada.pronostico.map((p) => [p.fecha, p]),
  );
  const promedioPorMes = new Map(
    entrada.promedioMensual.map((c) => [c.mes, c]),
  );

  return entrada.fechas.map((fecha) => {
    const offset = diasDesde(entrada.hoy, fecha);
    const pron = pronosticoPorFecha.get(fecha);

    // Dentro del horizonte y con pronóstico disponible: usar pronóstico.
    if (pron && offset >= 0 && offset < HORIZONTE_PRONOSTICO_DIAS) {
      const fuente =
        offset < HORIZONTE_FIABLE_DIAS ? 'pronostico' : 'tendencia';
      return {
        fecha,
        lluvioso: esLluviosoPronostico(pron, umbrales),
        fuente,
        probabilidadLluvia: pron.probabilidadPct / 100,
        tempMin: pron.tempMin,
        tempMax: pron.tempMax,
      };
    }

    // Fuera del horizonte o sin pronóstico: promedio mensual del seed.
    const prom = promedioPorMes.get(mesDe(fecha));
    if (prom) {
      return {
        fecha,
        lluvioso: esLluviosoPromedio(prom, umbrales),
        fuente: 'promedio',
        probabilidadLluvia: prom.prob_lluvia,
        tempMin: prom.temp_min,
        tempMax: prom.temp_max,
      };
    }

    // Sin dato alguno: día seco por defecto (no penaliza), probabilidad 0.
    return {
      fecha,
      lluvioso: false,
      fuente: 'promedio',
      probabilidadLluvia: 0,
    };
  });
}

/** Reduce el detalle a lo que consume el generador de itinerario (ClimaDia). */
export function aClimaDia(
  detalles: ClimaDiaDetalle[],
): { fecha: string; lluvioso: boolean }[] {
  return detalles.map((d) => ({ fecha: d.fecha, lluvioso: d.lluvioso }));
}
