// Reorganización por clima (plan.md 6.1 paso 9), expuesta como operación
// independiente para la vista previa de T-18.
//
// A diferencia de la búsqueda local que corre dentro de generarItinerario (paso
// 7), esta función opera sobre un itinerario YA generado y posiblemente editado
// por el usuario, con un clima actualizado. Hace dos cosas:
//   1. Reproyecta la marca `lluvioso` de cada día desde el `climaPorDia` dado
//      (el itinerario pudo generarse sin clima o con otro).
//   2. Reubica actividades al aire libre de días lluviosos a días secos con el
//      mismo municipio base, sin mover ítems fijados y respetando la jornada
//      (reutiliza buscarLocal, que ya implementa ese movimiento determinista).
//
// Nunca muta la entrada. Devuelve el candidato y si cambió respecto al original,
// para que la UI muestre la vista previa y solo aplique si hay mejora.
//
// Costos: la reubicación conserva el total (mueve actividades entre días con la
// misma base, sin quitarlas), así que no hace falta re-ejecutar el paso 8. Si en
// el futuro el paso 9 llegara a quitar actividades, habría que re-ajustar.

import type { Atraccion } from '../catalogo/esquemas';
import { buscarLocal } from './busqueda-local';
import type { ClimaDia, Itinerario } from './tipos';

export interface OpcionesReorganizar {
  /** Atracciones del catálogo (para consultar al_aire_libre). */
  atracciones: Atraccion[];
  /** Clima por fecha del viaje; redefine la marca lluviosa de cada día. */
  climaPorDia: ClimaDia[];
  /** Límite de jornada en minutos (por defecto 540). */
  limiteJornadaMin?: number;
  /** Peso μ de la penalización por lluvia (por defecto el de buscarLocal). */
  pesoLluvia?: number;
}

export interface ResultadoReorganizar {
  /** Itinerario candidato tras la reorganización (no aplicado aún). */
  candidato: Itinerario;
  /** true si el candidato difiere del itinerario original. */
  cambio: boolean;
}

/** Aplica las marcas de lluvia del climaPorDia a los días del itinerario. */
function marcarLluvia(
  itinerario: Itinerario,
  climaPorDia: ClimaDia[],
): Itinerario {
  const lluviaPorFecha = new Map(climaPorDia.map((c) => [c.fecha, c.lluvioso]));
  return {
    ...itinerario,
    dias: itinerario.dias.map((d) => ({
      ...d,
      lluvioso: lluviaPorFecha.get(d.fecha) ?? false,
    })),
  };
}

/** Firma comparable de la asignación de actividades por día (orden incluido). */
function firma(itinerario: Itinerario): string {
  return itinerario.dias
    .map(
      (d) =>
        `${d.dia}:` +
        d.items
          .filter((it) => it.tipo === 'actividad')
          .map((it) => it.atraccionId ?? '')
          .join(','),
    )
    .join('|');
}

/**
 * Reorganiza el itinerario por clima y devuelve un candidato para vista previa.
 * No muta la entrada. `cambio` indica si el candidato difiere del original (en
 * la asignación de actividades a días), para que la UI ofrezca aplicar o no.
 */
export function reorganizarPorClima(
  itinerario: Itinerario,
  opciones: OpcionesReorganizar,
): ResultadoReorganizar {
  // 1. Reproyectar la lluvia de cada día desde el clima vigente.
  const conClima = marcarLluvia(itinerario, opciones.climaPorDia);

  // 2. Reubicar actividades al aire libre de días lluviosos a días secos.
  const candidato = buscarLocal(conClima, {
    atracciones: opciones.atracciones,
    limiteJornadaMin: opciones.limiteJornadaMin,
    pesoLluvia: opciones.pesoLluvia,
  });

  return { candidato, cambio: firma(candidato) !== firma(itinerario) };
}
