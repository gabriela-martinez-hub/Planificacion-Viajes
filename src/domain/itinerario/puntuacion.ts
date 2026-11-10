// Puntuación de atracciones y desempate determinista (plan.md 6.0 y 6.1 paso 1).
//
// La puntuación mide la coincidencia entre los estilos del viaje y los de la
// atracción. El desempate es siempre (puntuación desc, costo asc, id asc): la
// misma entrada produce el mismo orden, sin aleatoriedad.

import type { Atraccion } from '../catalogo/esquemas';
import type { Estilo } from './tipos';

/**
 * Puntúa una atracción según cuántos de sus estilos coinciden con los del viaje.
 * - Si el viaje no fija estilos, todas valen 1 (ninguna preferencia).
 * - Cada estilo coincidente suma 1.
 * - El casco urbano recibe un pequeño valor base para que entre cuando no hay
 *   nada más que ver, pero quede por debajo de cualquier atracción real que
 *   coincida con un estilo.
 */
export function puntuar(atraccion: Atraccion, estilosViaje: Estilo[]): number {
  const base = atraccion.es_casco_urbano ? 0.1 : 1;
  if (estilosViaje.length === 0) return base;
  const coincidencias = atraccion.estilos.filter((e) =>
    estilosViaje.includes(e),
  ).length;
  return base + coincidencias;
}

/** Costo por persona de visitar una atracción (entrada + actividad + transporte local). */
export function costoAtraccion(atraccion: Atraccion): number {
  return (
    atraccion.costo_entrada_cop +
    (atraccion.costo_actividad_cop ?? 0) +
    atraccion.transporte_local_cop
  );
}

/**
 * Comparador de desempate determinista: puntuación descendente, costo
 * ascendente, id ascendente (plan.md 6.0). Devuelve < 0 si `a` va antes que `b`.
 */
export function compararAtracciones(
  a: Atraccion,
  b: Atraccion,
  estilosViaje: Estilo[],
): number {
  const pa = puntuar(a, estilosViaje);
  const pb = puntuar(b, estilosViaje);
  if (pa !== pb) return pb - pa; // mayor puntuación primero
  const ca = costoAtraccion(a);
  const cb = costoAtraccion(b);
  if (ca !== cb) return ca - cb; // menor costo primero
  return a.id.localeCompare(b.id); // id ascendente
}

/** Ordena una copia de las atracciones con el desempate determinista. */
export function ordenarPorPreferencia(
  atracciones: Atraccion[],
  estilosViaje: Estilo[],
): Atraccion[] {
  return [...atracciones].sort((a, b) =>
    compararAtracciones(a, b, estilosViaje),
  );
}
