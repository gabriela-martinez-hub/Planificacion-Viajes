// Función objetivo y verificador de restricciones del generador (plan.md 6.0).
//
// Estos dos cálculos son el núcleo de la evaluación académica (T-27): permiten
// puntuar cualquier itinerario con la misma vara y comprobar que no viola
// ninguna restricción dura. Son puros y no dependen del algoritmo que produjo
// el itinerario, así que sirven para comparar voraz, voraz + búsqueda local y
// fuerza bruta en igualdad de condiciones.
//
// Objetivo (a maximizar), plan.md 6.0:
//   Σ puntuación(a) − λ · minutos_de_traslado − μ · penalización_lluvia
// donde:
//   - puntuación(a) es la coincidencia de estilos (puntuacion.ts),
//   - minutos_de_traslado suma los minutos de bus de los ítems de traslado,
//   - penalización_lluvia cuenta actividades al aire libre en días lluviosos.
//
// Restricciones duras (deben dar 0 violaciones):
//   - límite de jornada por día (salvo los días de solo traslado marcados),
//   - días de cierre de cada atracción,
//   - atracciones con estado_acceso = 'cerrada' excluidas (salvo obligatorias),
//   - atracciones obligatorias incluidas,
//   - cada actividad del día pertenece al municipio base de ese día,
//   - sin atracciones repetidas en todo el itinerario.

import type { Atraccion } from '../../catalogo/esquemas';
import { diaSemana } from '../fechas';
import { puntuar } from '../puntuacion';
import type { EntradaItinerario, Itinerario } from '../tipos';

/** Pesos del objetivo (λ y μ de 6.0). Valores por defecto del plan. */
export const PESO_TRASLADO_POR_DEFECTO = 1; // λ: por minuto de bus
export const PESO_LLUVIA_POR_DEFECTO = 50; // μ: por actividad al aire libre en lluvia

export interface DesglosesObjetivo {
  puntuacionActividades: number;
  minutosTraslado: number;
  actividadesLluvia: number;
  /** Valor final del objetivo (mayor es mejor). */
  valor: number;
}

/**
 * Calcula el valor de la función objetivo de 6.0 para un itinerario.
 * `estilos` y los pesos vienen de la entrada que lo generó.
 */
export function calcularObjetivo(
  itinerario: Itinerario,
  entrada: Pick<EntradaItinerario, 'estilos' | 'pesoTraslado' | 'pesoLluvia'>,
  atracciones: Atraccion[],
): DesglosesObjetivo {
  const lambda = entrada.pesoTraslado ?? PESO_TRASLADO_POR_DEFECTO;
  const mu = entrada.pesoLluvia ?? PESO_LLUVIA_POR_DEFECTO;
  const porId = new Map(atracciones.map((a) => [a.id, a]));

  let puntuacionActividades = 0;
  let minutosTraslado = 0;
  let actividadesLluvia = 0;

  for (const dia of itinerario.dias) {
    for (const item of dia.items) {
      if (item.tipo === 'traslado') {
        minutosTraslado += item.duracionMin;
      } else if (item.tipo === 'actividad' && item.atraccionId) {
        const atr = porId.get(item.atraccionId);
        if (!atr) continue;
        puntuacionActividades += puntuar(atr, entrada.estilos);
        if (dia.lluvioso && atr.al_aire_libre) actividadesLluvia += 1;
      }
    }
  }

  const valor =
    puntuacionActividades - lambda * minutosTraslado - mu * actividadesLluvia;
  return { puntuacionActividades, minutosTraslado, actividadesLluvia, valor };
}

// ------------------------------------------------------------ restricciones

export interface Violacion {
  tipo:
    | 'limite_jornada'
    | 'dia_cerrado'
    | 'cerrada_incluida'
    | 'obligatoria_faltante'
    | 'fuera_de_base'
    | 'atraccion_repetida';
  detalle: string;
}

/**
 * Verifica las restricciones duras de 6.0 sobre un itinerario ya construido.
 * Devuelve la lista de violaciones; vacía significa que el itinerario es
 * factible. Se usa en la evaluación (debe dar 0) y en las pruebas.
 */
export function verificarRestricciones(
  itinerario: Itinerario,
  entrada: EntradaItinerario,
): Violacion[] {
  const violaciones: Violacion[] = [];
  const atracciones = entrada.catalogo.atracciones;
  const porId = new Map(atracciones.map((a) => [a.id, a]));
  const obligatorias = new Set(entrada.atraccionesObligatorias);
  const limite = entrada.limiteJornadaMin || 540;

  const vistas = new Set<string>();

  for (const dia of itinerario.dias) {
    // Límite de jornada: solo aplica a días que NO son de solo traslado.
    if (!dia.soloTraslado && dia.minutosUsados > limite) {
      violaciones.push({
        tipo: 'limite_jornada',
        detalle: `Día ${dia.dia}: ${dia.minutosUsados} min > límite ${limite} min`,
      });
    }

    const dow = diaSemana(dia.fecha);

    for (const item of dia.items) {
      if (item.tipo !== 'actividad' || !item.atraccionId) continue;
      const atr = porId.get(item.atraccionId);
      if (!atr) continue;

      // Sin repetir en todo el itinerario.
      if (vistas.has(atr.id)) {
        violaciones.push({
          tipo: 'atraccion_repetida',
          detalle: `La atracción ${atr.id} aparece más de una vez`,
        });
      }
      vistas.add(atr.id);

      // Pertenece al municipio base del día.
      if (atr.municipio_id !== dia.municipioBaseId) {
        violaciones.push({
          tipo: 'fuera_de_base',
          detalle: `Día ${dia.dia}: la atracción ${atr.id} (${atr.municipio_id}) no es del municipio base ${dia.municipioBaseId}`,
        });
      }

      // No está cerrada ese día de la semana.
      if (atr.dias_cerrado.includes(dow)) {
        violaciones.push({
          tipo: 'dia_cerrado',
          detalle: `Día ${dia.dia} (dow ${dow}): la atracción ${atr.id} está cerrada ese día`,
        });
      }

      // Atracción con acceso cerrado solo se permite si es obligatoria.
      if (atr.estado_acceso === 'cerrada' && !obligatorias.has(atr.id)) {
        violaciones.push({
          tipo: 'cerrada_incluida',
          detalle: `La atracción ${atr.id} tiene acceso 'cerrada' y no es obligatoria`,
        });
      }
    }
  }

  // Todas las obligatorias (ubicables) deben estar incluidas. Una obligatoria
  // cuyo municipio no es base de ningún día no es ubicable: el generador lo
  // avisa en lugar de fallar, así que no cuenta como violación dura.
  const basesUsadas = new Set(itinerario.dias.map((d) => d.municipioBaseId));
  for (const id of obligatorias) {
    const atr = porId.get(id);
    if (!atr) continue;
    const ubicable = basesUsadas.has(atr.municipio_id);
    if (ubicable && !vistas.has(id)) {
      violaciones.push({
        tipo: 'obligatoria_faltante',
        detalle: `La atracción obligatoria ${id} no quedó incluida`,
      });
    }
  }

  return violaciones;
}
