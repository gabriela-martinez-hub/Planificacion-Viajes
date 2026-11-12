// Tipos del ajuste de presupuesto (plan.md 6.1 paso 8 y 6.2).
//
// El dominio es puro y determinista: recibe un itinerario y una entrada, y
// devuelve un resultado tipado. No lee red ni la hora del sistema.

import type { DesgloseCostos, Itinerario, Nivel } from '../itinerario';

/** Niveles de menor a mayor gasto, para bajar un escalón (plan.md 6.1 paso 8). */
export const NIVELES_ASC: Nivel[] = ['economico', 'medio', 'alto'];

/** Costos del viaje para todo el grupo y por persona (plan.md 6.2). */
export interface PresupuestoDesglose {
  /** Costos totales del grupo (los que trae el itinerario). */
  grupo: DesgloseCostos;
  /** Los mismos costos divididos entre los viajeros. */
  porPersona: DesgloseCostos;
  viajeros: number;
}

/**
 * Resultado del ajuste a un monto fijo (plan.md 6.1 paso 8):
 * - ok: hay un itinerario factible con total <= monto. Trae el itinerario
 *   ajustado, su desglose y qué se cambió para lograrlo.
 * - no-ok: ni con el nivel económico, sin actividades, se alcanza el monto. Se
 *   devuelve el mínimo posible para informarlo; no se guarda como ajustado.
 */
export type ResultadoAjuste =
  | {
      ok: true;
      itinerario: Itinerario;
      desglose: PresupuestoDesglose;
      /** Nivel final de alojamiento y comida tras el ajuste. */
      nivelAlojamiento: Nivel;
      nivelComida: Nivel;
      /** Ids de atracciones no obligatorias que se quitaron para ajustar. */
      actividadesQuitadas: string[];
      /** true si hubo que cambiar algo respecto al itinerario original. */
      ajustado: boolean;
    }
  | {
      ok: false;
      /** Costo mínimo alcanzable (nivel económico, sin actividades no obligatorias). */
      minimoCop: number;
      /** Itinerario mínimo, para mostrar el desglose de por qué no alcanza. */
      itinerarioMinimo: Itinerario;
      desgloseMinimo: PresupuestoDesglose;
    };
