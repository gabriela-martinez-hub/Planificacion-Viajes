// Ajuste del itinerario a un presupuesto fijo (plan.md 6.1 paso 8).
//
// Orden del ajuste, parando apenas total <= monto:
//   1. Bajar alojamiento un escalón para todo el viaje y recalcular.
//   2. Bajar comida un escalón y recalcular. Repetir 1 y 2 hasta económico.
//   3. Quitar actividades NO obligatorias en orden ascendente de
//      puntuacion / max(costo, 1), con desempate por id.
//   4. Si aún no alcanza, devolver { ok:false, minimoCop }.
//
// Las atracciones obligatorias nunca se quitan. Todo es determinista: la misma
// entrada y el mismo monto producen el mismo resultado.
//
// Para bajar niveles se regenera el itinerario con `generarItinerario` (bajar un
// nivel cambia las tarifas de todos los días). La poda de actividades opera
// sobre el itinerario ya armado, recalculando sus costos.

import {
  generarItinerario,
  type DesgloseCostos,
  type EntradaItinerario,
  type Itinerario,
  type ItemItinerario,
  type Nivel,
} from '../itinerario';
import { costoAtraccion, puntuar } from '../itinerario';
import type { Atraccion } from '../catalogo/esquemas';
import { desglosar } from './desglose';
import { NIVELES_ASC, type ResultadoAjuste } from './tipos';

/** Combinaciones (alojamiento, comida) desde el nivel actual hacia abajo,
 *  bajando primero alojamiento y luego comida, como pide el paso 8. */
function combinacionesNiveles(nivel: Nivel): { aloj: Nivel; comida: Nivel }[] {
  const indiceInicial = NIVELES_ASC.indexOf(nivel);
  const combos: { aloj: Nivel; comida: Nivel }[] = [];
  let comida: Nivel = nivel;

  // Fase 1: bajar alojamiento un escalón a la vez (comida fija en el inicial).
  for (let i = indiceInicial; i >= 0; i--) {
    combos.push({ aloj: NIVELES_ASC[i], comida });
  }
  // Fase 2: alojamiento ya en el mínimo; bajar comida escalón a escalón.
  for (let j = indiceInicial - 1; j >= 0; j--) {
    comida = NIVELES_ASC[j];
    combos.push({ aloj: NIVELES_ASC[0], comida });
  }
  return combos;
}

/**
 * Regenera el itinerario forzando un nivel de alojamiento y comida. El generador
 * actual usa un único `nivel`; para combinar alojamiento y comida distintos se
 * regenera con cada uno y se combinan los rubros (alojamiento de uno, comida del
 * otro). Mantiene el orden y las actividades de la generación base.
 */
function regenerarConNiveles(
  entrada: EntradaItinerario,
  aloj: Nivel,
  comida: Nivel,
): Itinerario | null {
  const base = generarItinerario({ ...entrada, nivel: aloj });
  if (!base.ok) return null;
  if (aloj === comida) return base.itinerario;

  const otro = generarItinerario({ ...entrada, nivel: comida });
  if (!otro.ok) return base.itinerario;

  // Reemplaza los ítems de comida del itinerario de alojamiento por los del de
  // comida (mismo día y municipio base; el generador es determinista).
  const comidaPorDia = new Map<number, ItemItinerario[]>();
  for (const d of otro.itinerario.dias) {
    comidaPorDia.set(
      d.dia,
      d.items.filter((it) => it.tipo === 'comida'),
    );
  }

  const dias = base.itinerario.dias.map((d) => {
    const sinComida = d.items.filter((it) => it.tipo !== 'comida');
    const comidaDia = comidaPorDia.get(d.dia) ?? [];
    const items = [...sinComida, ...comidaDia]
      .sort((a, b) => a.orden - b.orden)
      .map((it, i) => ({ ...it, orden: i + 1 }));
    return { ...d, items };
  });

  const itinerario: Itinerario = {
    ...base.itinerario,
    dias,
    costos: recalcularCostos(dias),
  };
  return itinerario;
}

/** Recalcula el desglose de costos sumando los ítems por tipo. */
function recalcularCostos(dias: { items: ItemItinerario[] }[]): DesgloseCostos {
  const costos: DesgloseCostos = {
    transporte: 0,
    alojamiento: 0,
    comida: 0,
    entradas: 0,
    actividades: 0,
    total: 0,
  };
  for (const d of dias) {
    for (const it of d.items) {
      costos.total += it.costoCop;
      if (it.tipo === 'traslado') costos.transporte += it.costoCop;
      else if (it.tipo === 'alojamiento') costos.alojamiento += it.costoCop;
      else if (it.tipo === 'comida') costos.comida += it.costoCop;
      else if (it.tipo === 'actividad') costos.entradas += it.costoCop;
    }
  }
  return costos;
}

/**
 * Quita actividades no obligatorias de un itinerario hasta que el total sea <=
 * monto o no queden más que quitar. Orden de sacrificio: menor
 * puntuacion / max(costo, 1) primero, desempate por id (plan.md 6.1 paso 8.3).
 * Devuelve el itinerario podado y los ids quitados.
 */
function podarActividades(
  itinerario: Itinerario,
  monto: number,
  atraccionPorId: Map<string, Atraccion>,
  obligatorias: Set<string>,
  estilos: EntradaItinerario['estilos'],
): { itinerario: Itinerario; quitadas: string[] } {
  // Recolecta las actividades no obligatorias y no fijadas, con su "valor".
  interface Candidata {
    atraccionId: string;
    dia: number;
    orden: number;
    valor: number; // puntuacion / max(costo, 1)
  }
  const candidatas: Candidata[] = [];
  for (const d of itinerario.dias) {
    for (const it of d.items) {
      if (it.tipo !== 'actividad' || !it.atraccionId) continue;
      if (obligatorias.has(it.atraccionId) || it.fijado) continue;
      const atr = atraccionPorId.get(it.atraccionId);
      if (!atr) continue;
      const p = puntuar(atr, estilos);
      const c = costoAtraccion(atr);
      candidatas.push({
        atraccionId: it.atraccionId,
        dia: d.dia,
        orden: it.orden,
        valor: p / Math.max(c, 1),
      });
    }
  }
  // Orden ascendente por valor; desempate por id (plan.md 6.1 paso 8.3).
  candidatas.sort((a, b) => {
    if (a.valor !== b.valor) return a.valor - b.valor;
    return a.atraccionId.localeCompare(b.atraccionId);
  });

  const quitar = new Set<string>();
  const quitadas: string[] = [];
  let dias = itinerario.dias;
  let costos = itinerario.costos;

  for (const c of candidatas) {
    if (costos.total <= monto) break;
    quitar.add(c.atraccionId);
    quitadas.push(c.atraccionId);
    dias = dias.map((d) => ({
      ...d,
      items: d.items
        .filter(
          (it) =>
            !(it.tipo === 'actividad' && quitar.has(it.atraccionId ?? '')),
        )
        .map((it, i) => ({ ...it, orden: i + 1 })),
    }));
    costos = recalcularCostos(dias);
  }

  return { itinerario: { ...itinerario, dias, costos }, quitadas };
}

/**
 * Ajusta el itinerario al monto fijo del grupo (plan.md 6.1 paso 8). `entrada`
 * es la misma que generó el itinerario; `monto` es el presupuesto total en COP.
 */
export function ajustarAPresupuesto(
  entrada: EntradaItinerario,
  monto: number,
): ResultadoAjuste {
  const atraccionPorId = new Map(
    entrada.catalogo.atracciones.map((a) => [a.id, a]),
  );
  const obligatorias = new Set(entrada.atraccionesObligatorias);

  const original = generarItinerario(entrada);
  // Si ni siquiera se puede generar, no hay nada que ajustar.
  if (!original.ok) {
    throw new Error(
      'No se puede ajustar: el itinerario base no se pudo generar.',
    );
  }

  // Si ya cumple sin tocar nada, se devuelve tal cual.
  if (original.itinerario.costos.total <= monto) {
    return {
      ok: true,
      itinerario: original.itinerario,
      desglose: desglosar(original.itinerario, entrada.viajeros),
      nivelAlojamiento: entrada.nivel,
      nivelComida: entrada.nivel,
      actividadesQuitadas: [],
      ajustado: false,
    };
  }

  // Pasos 1-2: bajar niveles. Probamos cada combinación y, en cada una, si hace
  // falta, podamos actividades (paso 3). Nos quedamos con la primera que cumpla.
  const combos = combinacionesNiveles(entrada.nivel);
  for (const { aloj, comida } of combos) {
    const it = regenerarConNiveles(entrada, aloj, comida);
    if (!it) continue;
    if (it.costos.total <= monto) {
      return {
        ok: true,
        itinerario: it,
        desglose: desglosar(it, entrada.viajeros),
        nivelAlojamiento: aloj,
        nivelComida: comida,
        actividadesQuitadas: [],
        ajustado: true,
      };
    }
  }

  // Paso 3: con los niveles al mínimo, podar actividades no obligatorias.
  const minAloj = NIVELES_ASC[0];
  const minComida = NIVELES_ASC[0];
  const itMin =
    regenerarConNiveles(entrada, minAloj, minComida) ?? original.itinerario;
  const podado = podarActividades(
    itMin,
    monto,
    atraccionPorId,
    obligatorias,
    entrada.estilos,
  );

  if (podado.itinerario.costos.total <= monto) {
    return {
      ok: true,
      itinerario: podado.itinerario,
      desglose: desglosar(podado.itinerario, entrada.viajeros),
      nivelAlojamiento: minAloj,
      nivelComida: minComida,
      actividadesQuitadas: podado.quitadas,
      ajustado: true,
    };
  }

  // Paso 4: no alcanza ni con el mínimo. El mínimo es el itinerario económico
  // con todas las actividades no obligatorias quitadas.
  return {
    ok: false,
    minimoCop: podado.itinerario.costos.total,
    itinerarioMinimo: podado.itinerario,
    desgloseMinimo: desglosar(podado.itinerario, entrada.viajeros),
  };
}
