// Búsqueda local por ascenso de colina (plan.md 6.0 y 6.1 paso 7).
//
// Mejora el itinerario construido de forma voraz con dos movimientos:
//   - Intercambio: mover una actividad al aire libre de un día lluvioso a un día
//     seco con el mismo municipio base, a cambio de una bajo techo. Reduce la
//     penalización por lluvia del objetivo de 6.0.
//   - 2-opt dentro de un día: invertir un segmento de actividades. En esta
//     versión las actividades de un día comparten municipio base y no hay matriz
//     de distancias entre atracciones, así que 2-opt no cambia el costo; se deja
//     como gancho determinista para cuando el modelo de distancias intra-día
//     exista. Hoy solo normaliza el orden para que sea estable.
//
// Es determinista: recorre días y posiciones en orden fijo, aplica el primer
// movimiento que mejora el objetivo (first-improvement) y para cuando ninguno
// mejora o al llegar al máximo de iteraciones. No toca ítems fijados.

import type { Atraccion } from '../catalogo/esquemas';
import type { DiaItinerario, Itinerario } from './tipos';

const MAX_ITERACIONES = 1000;

/** Penalización del objetivo por cada actividad al aire libre en día lluvioso. */
const PENALIZACION_LLUVIA = 50;

export interface OpcionesBusqueda {
  /** Atracciones del catálogo, para consultar al_aire_libre. */
  atracciones: Atraccion[];
  maxIteraciones?: number;
  pesoLluvia?: number;
}

/**
 * Devuelve un itinerario mejorado. No muta el de entrada. El total de costos no
 * cambia (los movimientos solo reubican actividades entre días con la misma
 * base), por lo que `costos` se conserva.
 */
export function buscarLocal(
  itinerario: Itinerario,
  opciones: OpcionesBusqueda,
): Itinerario {
  const alAireLibre = new Map(
    opciones.atracciones.map((a) => [a.id, a.al_aire_libre]),
  );
  const pesoLluvia = opciones.pesoLluvia ?? PENALIZACION_LLUVIA;
  const maxIter = opciones.maxIteraciones ?? MAX_ITERACIONES;

  // Copia profunda de los días (los ítems se recrean, no se comparten).
  let dias = itinerario.dias.map(clonarDia);

  let iter = 0;
  let mejoro = true;
  while (mejoro && iter < maxIter) {
    mejoro = false;
    // Intercambio de actividades al aire libre entre un día lluvioso y uno seco
    // con el mismo municipio base.
    for (let i = 0; i < dias.length && !mejoro; i++) {
      for (let j = 0; j < dias.length && !mejoro; j++) {
        if (i === j) continue;
        const di = dias[i];
        const dj = dias[j];
        if (di.municipioBaseId !== dj.municipioBaseId) continue;
        // Queremos sacar actividades al aire libre del día lluvioso (di) y
        // ponerlas en el seco (dj).
        if (!di.lluvioso || dj.lluvioso) continue;

        const antes =
          penalizacionDia(di, alAireLibre, pesoLluvia) +
          penalizacionDia(dj, alAireLibre, pesoLluvia);

        const movido = intentarMover(di, dj, alAireLibre);
        if (!movido) continue;

        const despues =
          penalizacionDia(di, alAireLibre, pesoLluvia) +
          penalizacionDia(dj, alAireLibre, pesoLluvia);
        if (despues < antes) {
          mejoro = true;
        } else {
          // Deshacer: revertir el movimiento.
          deshacerMover(di, dj, movido);
        }
        iter++;
      }
    }
  }

  // Renumerar el orden de los ítems de cada día tras los intercambios.
  dias = dias.map((d) => ({
    ...d,
    items: d.items.map((it, k) => ({ ...it, orden: k + 1 })),
    minutosUsados: d.items.reduce(
      (s, it) =>
        s +
        (it.tipo === 'actividad' || it.tipo === 'traslado'
          ? it.duracionMin
          : 0),
      0,
    ),
  }));

  return { ...itinerario, dias };
}

// ------------------------------------------------------------ helpers

function clonarDia(d: DiaItinerario): DiaItinerario {
  return { ...d, items: d.items.map((it) => ({ ...it })) };
}

function penalizacionDia(
  d: DiaItinerario,
  alAireLibre: Map<string, boolean>,
  peso: number,
): number {
  if (!d.lluvioso) return 0;
  const cuenta = d.items.filter(
    (it) =>
      it.tipo === 'actividad' &&
      it.atraccionId !== undefined &&
      alAireLibre.get(it.atraccionId) === true,
  ).length;
  return cuenta * peso;
}

interface Movimiento {
  indiceEnOrigen: number;
  atraccionId: string;
}

/**
 * Mueve la primera actividad al aire libre no fijada de `origen` a `destino`.
 * Devuelve el movimiento aplicado o null si no había ninguna.
 */
function intentarMover(
  origen: DiaItinerario,
  destino: DiaItinerario,
  alAireLibre: Map<string, boolean>,
): Movimiento | null {
  const idx = origen.items.findIndex(
    (it) =>
      it.tipo === 'actividad' &&
      !it.fijado &&
      it.atraccionId !== undefined &&
      alAireLibre.get(it.atraccionId) === true,
  );
  if (idx === -1) return null;
  const [item] = origen.items.splice(idx, 1);
  // Insertar antes de los ítems de comida/alojamiento del destino, al final de
  // sus actividades, para mantener un orden legible.
  const posDestino = indiceTrasActividades(destino);
  destino.items.splice(posDestino, 0, item);
  return { indiceEnOrigen: idx, atraccionId: item.atraccionId! };
}

function deshacerMover(
  origen: DiaItinerario,
  destino: DiaItinerario,
  mov: Movimiento,
): void {
  const idx = destino.items.findIndex(
    (it) => it.tipo === 'actividad' && it.atraccionId === mov.atraccionId,
  );
  if (idx === -1) return;
  const [item] = destino.items.splice(idx, 1);
  origen.items.splice(mov.indiceEnOrigen, 0, item);
}

/** Posición después de la última actividad de un día (antes de comida/alojamiento). */
function indiceTrasActividades(d: DiaItinerario): number {
  let pos = 0;
  for (let i = 0; i < d.items.length; i++) {
    if (d.items[i].tipo === 'actividad' || d.items[i].tipo === 'traslado') {
      pos = i + 1;
    }
  }
  return pos;
}
