// Óptimo por fuerza bruta para instancias pequeñas (plan.md 6.0, T-27).
//
// Sirve de referencia para medir la brecha de optimalidad de la heurística
// (voraz y voraz + búsqueda local). Solo se usa en instancias con pocas
// atracciones candidatas (≤ 8 por la explosión combinatoria).
//
// Para que la comparación sea JUSTA, la fuerza bruta usa el mismo modelo que el
// generador: la misma estructura de días y municipios base (orden, traslados de
// llegada y regreso, tarifas) que fija generarItinerario, y la misma función
// objetivo (objetivo.ts). Lo único que enumera exhaustivamente es la decisión
// que el voraz toma de forma heurística: QUÉ atracciones van en QUÉ día.
//
// Enumera todas las asignaciones de cada atracción candidata a {ninguno, día 1,
// …, día n} que respeten las restricciones duras, y devuelve la de mayor
// objetivo. El desempate es determinista (mayor objetivo; a igualdad, la de
// menos minutos de traslado y luego la primera encontrada).

import type { Atraccion } from '../../catalogo/esquemas';
import { generarItinerario } from '../index';
import { diaSemana } from '../fechas';
import { calcularObjetivo, verificarRestricciones } from './objetivo';
import type { EntradaItinerario, Itinerario } from '../tipos';

export interface ResultadoFuerzaBruta {
  /** Mejor valor de objetivo alcanzable (óptimo exacto en este modelo). */
  objetivoOptimo: number;
  /** Número de asignaciones factibles evaluadas. */
  evaluadas: number;
}

/**
 * Calcula el óptimo exacto del objetivo para una instancia pequeña. Lanza si la
 * instancia es demasiado grande para la fuerza bruta (> maxCandidatas).
 */
export function optimoFuerzaBruta(
  entrada: EntradaItinerario,
  maxCandidatas = 8,
): ResultadoFuerzaBruta {
  // Reconstruimos la "plantilla" de días y bases con el propio generador. Así
  // la fuerza bruta explora el mismo espacio de días/bases que la heurística.
  const base = generarItinerario(entrada);
  if (!base.ok) {
    // Si la instancia es infactible, el óptimo es trivial: no hay actividades.
    return { objetivoOptimo: 0, evaluadas: 0 };
  }

  const dias = base.itinerario.dias;
  const porId = new Map(entrada.catalogo.atracciones.map((a) => [a.id, a]));

  // Días que pueden recibir actividades (no son de solo traslado), con sus
  // minutos ya ocupados por traslados y el municipio base.
  const diasActivos = dias
    .filter((d) => !d.soloTraslado)
    .map((d) => ({
      dia: d.dia,
      municipioBaseId: d.municipioBaseId,
      dow: diaSemana(d.fecha),
      minutosTraslado: d.items
        .filter((it) => it.tipo === 'traslado')
        .reduce((s, it) => s + it.duracionMin, 0),
    }));

  // Candidatas: atracciones de los municipios base, abiertas, no cerradas
  // (salvo obligatorias). Mismas reglas de filtro que el generador.
  const obligatorias = new Set(entrada.atraccionesObligatorias);
  const basesActivas = new Set(diasActivos.map((d) => d.municipioBaseId));
  const candidatas: Atraccion[] = entrada.catalogo.atracciones.filter(
    (a) =>
      basesActivas.has(a.municipio_id) &&
      (a.estado_acceso !== 'cerrada' || obligatorias.has(a.id)),
  );

  if (candidatas.length > maxCandidatas) {
    throw new Error(
      `Instancia demasiado grande para fuerza bruta: ${candidatas.length} candidatas (máx ${maxCandidatas})`,
    );
  }

  const limite = entrada.limiteJornadaMin || 540;

  // Para cada candidata, las opciones son: no incluirla (índice -1) o ubicarla
  // en alguno de los días activos cuyo municipio base coincida y donde abra.
  const opcionesPorCandidata = candidatas.map((a) => {
    const diasValidos = diasActivos
      .filter(
        (d) =>
          d.municipioBaseId === a.municipio_id &&
          !a.dias_cerrado.includes(d.dow),
      )
      .map((d) => d.dia);
    return { atraccion: a, dias: [-1, ...diasValidos] };
  });

  let objetivoOptimo = -Infinity;
  let evaluadas = 0;

  // Producto cartesiano de las opciones (backtracking). El costo en tiempo por
  // día se valida incrementalmente para podar ramas que exceden la jornada.
  const asignacion = new Map<number, string[]>(); // dia -> atraccionIds
  const minutosPorDia = new Map<number, number>();
  for (const d of diasActivos) minutosPorDia.set(d.dia, d.minutosTraslado);

  const recorrer = (i: number): void => {
    if (i === opcionesPorCandidata.length) {
      // Todas las obligatorias ubicables deben estar incluidas.
      for (const id of obligatorias) {
        const atr = porId.get(id);
        if (!atr) continue;
        if (!basesActivas.has(atr.municipio_id)) continue; // no ubicable
        const incluida = [...asignacion.values()].some((ids) =>
          ids.includes(id),
        );
        if (!incluida) return; // poda: falta una obligatoria
      }
      const itinerario = construirDesdeAsignacion(
        base.itinerario,
        asignacion,
        porId,
      );
      const violaciones = verificarRestricciones(itinerario, entrada);
      if (violaciones.length > 0) return; // no debería pasar, pero por seguridad
      evaluadas++;
      const obj = calcularObjetivo(
        itinerario,
        entrada,
        entrada.catalogo.atracciones,
      ).valor;
      if (obj > objetivoOptimo) objetivoOptimo = obj;
      return;
    }

    const { atraccion, dias: opciones } = opcionesPorCandidata[i];
    const costoTiempo =
      atraccion.duracion_min + 2 * atraccion.minutos_desde_casco;

    for (const dia of opciones) {
      if (dia === -1) {
        recorrer(i + 1);
        continue;
      }
      const usado = minutosPorDia.get(dia) ?? 0;
      if (usado + costoTiempo > limite) continue; // poda por jornada
      minutosPorDia.set(dia, usado + costoTiempo);
      const lista = asignacion.get(dia) ?? [];
      lista.push(atraccion.id);
      asignacion.set(dia, lista);

      recorrer(i + 1);

      lista.pop();
      minutosPorDia.set(dia, usado);
    }
  };

  recorrer(0);

  // Si ninguna asignación fue factible (p. ej. una obligatoria imposible), el
  // óptimo es el itinerario base sin actividades extra.
  if (objetivoOptimo === -Infinity) {
    objetivoOptimo = calcularObjetivo(
      base.itinerario,
      entrada,
      entrada.catalogo.atracciones,
    ).valor;
  }

  return { objetivoOptimo, evaluadas };
}

/**
 * Construye un itinerario "sombra" a partir de la plantilla base y una
 * asignación {día → atraccionIds}, solo para evaluarlo con el objetivo y las
 * restricciones. Reemplaza las actividades de cada día por las asignadas,
 * conservando traslados, comida y alojamiento de la plantilla.
 */
function construirDesdeAsignacion(
  plantilla: Itinerario,
  asignacion: Map<number, string[]>,
  porId: Map<string, Atraccion>,
): Itinerario {
  const dias = plantilla.dias.map((d) => {
    const nuevasActividades = asignacion.get(d.dia) ?? [];
    const noActividades = d.items.filter((it) => it.tipo !== 'actividad');
    const actividades = nuevasActividades.map((id, k) => {
      const atr = porId.get(id);
      const duracion = atr ? atr.duracion_min + 2 * atr.minutos_desde_casco : 0;
      return {
        orden: 1000 + k,
        tipo: 'actividad' as const,
        atraccionId: id,
        descripcion: id,
        duracionMin: duracion,
        costoCop: 0,
        fijado: false,
      };
    });
    const items = [...noActividades, ...actividades].map((it, k) => ({
      ...it,
      orden: k + 1,
    }));
    // Recalcular minutos usados (traslados + actividades) para que el
    // verificador de jornada actúe sobre los tiempos reales de esta asignación.
    const minutosUsados = items.reduce(
      (s, it) =>
        s +
        (it.tipo === 'actividad' || it.tipo === 'traslado'
          ? it.duracionMin
          : 0),
      0,
    );
    return { ...d, items, minutosUsados };
  });
  return { ...plantilla, dias };
}
