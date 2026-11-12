// Progreso del usuario por municipio, departamento y ruta (T-21, plan.md 6.4).
//
// Es el REFLEJO en el cliente de las reglas del trigger SQL
// recalcular_insignias_usuario: sirve para MOSTRAR el avance en el perfil. Lo
// que otorga insignias lo decide el servidor (insignias_usuario); aquí solo
// calculamos cuánto falta. Funciones puras: reciben check-ins y catálogo.

import type {
  Departamento,
  Municipio,
  RutaTematica,
  RutaItem,
} from '../catalogo/esquemas';
import type { Checkin } from './esquemas';

/** Estado de visita de un componente (municipio o atracción). */
export interface Visita {
  visitado: boolean;
  verificado: boolean;
}

/** Progreso de un conjunto de componentes (departamento o ruta). */
export interface Progreso {
  total: number;
  visitados: number;
  verificados: number;
  /** true si todos los componentes están visitados (insignia otorgable). */
  completo: boolean;
  /** true si al menos ceil(0.8 * total) están verificados (plan.md 6.4). */
  verificada: boolean;
}

/** Un municipio está visitado si hay algún check-in con ese municipio_id. */
export function visitaMunicipio(
  municipioId: string,
  checkins: Checkin[],
): Visita {
  let visitado = false;
  let verificado = false;
  for (const c of checkins) {
    if (c.municipio_id === municipioId) {
      visitado = true;
      if (c.verificado) verificado = true;
    }
  }
  return { visitado, verificado };
}

/** Una atracción está visitada si hay algún check-in con ese atraccion_id. */
export function visitaAtraccion(
  atraccionId: string,
  checkins: Checkin[],
): Visita {
  let visitado = false;
  let verificado = false;
  for (const c of checkins) {
    if (c.atraccion_id === atraccionId) {
      visitado = true;
      if (c.verificado) verificado = true;
    }
  }
  return { visitado, verificado };
}

/** Combina una lista de visitas en un Progreso (regla del 80 % del trigger). */
function resumir(visitas: Visita[]): Progreso {
  const total = visitas.length;
  const visitados = visitas.filter((v) => v.visitado).length;
  const verificados = visitas.filter((v) => v.verificado).length;
  const requeridosVerif = Math.ceil(0.8 * total);
  return {
    total,
    visitados,
    verificados,
    completo: total > 0 && visitados === total,
    verificada: total > 0 && verificados >= requeridosVerif,
  };
}

/** Ids de los municipios visitados (para pintar el mapa del perfil). */
export function municipiosVisitados(checkins: Checkin[]): Set<string> {
  return new Set(checkins.map((c) => c.municipio_id));
}

/** Progreso de un departamento: sus municipios con check-in. */
export function progresoDepartamento(
  departamentoId: string,
  municipios: Municipio[],
  checkins: Checkin[],
): Progreso {
  const visitas = municipios
    .filter((m) => m.departamento_id === departamentoId)
    .map((m) => visitaMunicipio(m.id, checkins));
  return resumir(visitas);
}

/** Progreso del Eje Cafetero: los 53 municipios. */
export function progresoEje(
  municipios: Municipio[],
  checkins: Checkin[],
): Progreso {
  return resumir(municipios.map((m) => visitaMunicipio(m.id, checkins)));
}

/**
 * Progreso de una ruta temática: sus ruta_items. Cada ítem es un municipio o
 * una atracción (misma condición que el trigger).
 */
export function progresoRuta(
  rutaId: string,
  rutaItems: RutaItem[],
  checkins: Checkin[],
): Progreso {
  const visitas = rutaItems
    .filter((ri) => ri.ruta_id === rutaId)
    .map((ri) =>
      ri.municipio_id !== undefined
        ? visitaMunicipio(ri.municipio_id, checkins)
        : visitaAtraccion(ri.atraccion_id as string, checkins),
    );
  return resumir(visitas);
}

/** Progreso de cada departamento, en orden de entrada. */
export function progresoPorDepartamento(
  departamentos: Departamento[],
  municipios: Municipio[],
  checkins: Checkin[],
): { departamento: Departamento; progreso: Progreso }[] {
  return departamentos.map((d) => ({
    departamento: d,
    progreso: progresoDepartamento(d.id, municipios, checkins),
  }));
}

/** Progreso de cada ruta, en orden de entrada. */
export function progresoPorRuta(
  rutas: RutaTematica[],
  rutaItems: RutaItem[],
  checkins: Checkin[],
): { ruta: RutaTematica; progreso: Progreso }[] {
  return rutas.map((r) => ({
    ruta: r,
    progreso: progresoRuta(r.id, rutaItems, checkins),
  }));
}
