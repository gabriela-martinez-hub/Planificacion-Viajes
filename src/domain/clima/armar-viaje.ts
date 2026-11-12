// Arma el clima por día de un viaje combinando el municipio base de cada día
// con el pronóstico y los promedios de ese municipio (plan.md 6.3). Puro.
//
// Cada día del itinerario tiene su municipio base; el clima de ese día usa el
// pronóstico (o el promedio) de ESE municipio. Esta función empareja día↔base y
// delega la clasificación por horizonte a clasificarDias.

import type { ClimaMensual } from '../catalogo/esquemas';
import { clasificarDias } from './clasificar';
import type { ClimaDiaDetalle, PronosticoDia, UmbralesLluvia } from './tipos';

/** Un día del viaje: su fecha y el municipio base donde se duerme/actúa. */
export interface DiaBase {
  fecha: string;
  municipioBaseId: string;
}

export interface EntradaClimaViaje {
  dias: DiaBase[];
  hoy: string;
  /** Pronóstico por municipio base: id → días. Puede faltar un municipio. */
  pronosticoPorMunicipio: Map<string, PronosticoDia[]>;
  /** Promedios mensuales por municipio base: id → filas. Puede faltar. */
  promedioPorMunicipio: Map<string, ClimaMensual[]>;
  umbrales?: UmbralesLluvia;
}

/**
 * Devuelve el detalle de clima por día (en el orden de `dias`). Para cada día
 * usa el pronóstico y el promedio de su municipio base; si no hay datos, el día
 * queda seco (lo resuelve clasificarDias).
 */
export function armarClimaViaje(entrada: EntradaClimaViaje): ClimaDiaDetalle[] {
  const porFecha = new Map<string, ClimaDiaDetalle>();

  // Agrupar las fechas por municipio base: cada base se clasifica con su propio
  // pronóstico/promedio, porque el clima depende del lugar.
  const fechasPorBase = new Map<string, string[]>();
  for (const d of entrada.dias) {
    const lista = fechasPorBase.get(d.municipioBaseId) ?? [];
    lista.push(d.fecha);
    fechasPorBase.set(d.municipioBaseId, lista);
  }

  for (const [base, fechas] of fechasPorBase) {
    const detalles = clasificarDias({
      fechas,
      hoy: entrada.hoy,
      pronostico: entrada.pronosticoPorMunicipio.get(base) ?? [],
      promedioMensual: entrada.promedioPorMunicipio.get(base) ?? [],
      umbrales: entrada.umbrales,
    });
    for (const det of detalles) porFecha.set(det.fecha, det);
  }

  // Reconstruir en el orden original de los días del viaje.
  return entrada.dias.map(
    (d) =>
      porFecha.get(d.fecha) ?? {
        fecha: d.fecha,
        lluvioso: false,
        fuente: 'promedio' as const,
        probabilidadLluvia: 0,
      },
  );
}
