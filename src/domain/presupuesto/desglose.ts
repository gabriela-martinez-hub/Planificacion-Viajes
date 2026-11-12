// Desglose de costos por persona (plan.md 6.2). Puro.

import type { DesgloseCostos, Itinerario } from '../itinerario';
import type { PresupuestoDesglose } from './tipos';

/** Divide cada rubro entre los viajeros (entero hacia arriba para no subestimar). */
function dividir(costos: DesgloseCostos, viajeros: number): DesgloseCostos {
  const n = Math.max(1, viajeros);
  const porRubro = (v: number) => Math.ceil(v / n);
  return {
    transporte: porRubro(costos.transporte),
    alojamiento: porRubro(costos.alojamiento),
    comida: porRubro(costos.comida),
    entradas: porRubro(costos.entradas),
    actividades: porRubro(costos.actividades),
    total: porRubro(costos.total),
  };
}

/** Arma el desglose de grupo y por persona de un itinerario. */
export function desglosar(
  itinerario: Itinerario,
  viajeros: number,
): PresupuestoDesglose {
  return {
    grupo: itinerario.costos,
    porPersona: dividir(itinerario.costos, viajeros),
    viajeros,
  };
}
