// Lógica pura de filtrado del catálogo, separada de la UI para poder probarla.
import type { Atraccion, Municipio } from '@/domain/catalogo/esquemas';
import { ESTILOS } from '@/domain/catalogo/esquemas';

export interface Filtros {
  busqueda: string;
  departamento: string; // '' = todos
  estilo: string; // '' = todos
}

/** Quita tildes y pasa a minúsculas para comparar sin importar acentos. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Agrupa las atracciones visibles por municipio. Excluye los cascos urbanos
 * (son solo para el generador) y aplica el filtro de estilo.
 */
export function atraccionesVisiblesPorMunicipio(
  atracciones: Atraccion[],
  estilo: string,
): Map<string, Atraccion[]> {
  const mapa = new Map<string, Atraccion[]>();
  for (const a of atracciones) {
    if (a.es_casco_urbano) continue;
    if (estilo && !a.estilos.includes(estilo as (typeof ESTILOS)[number]))
      continue;
    const lista = mapa.get(a.municipio_id) ?? [];
    lista.push(a);
    mapa.set(a.municipio_id, lista);
  }
  return mapa;
}

/**
 * Atracciones que pasan los filtros, como lista plana (para la pestaña de
 * atracciones). Excluye cascos urbanos. Filtra por departamento (según el
 * municipio de la atracción), estilo y búsqueda por nombre.
 */
export function atraccionesFiltradas(
  atracciones: Atraccion[],
  municipios: Municipio[],
  filtros: Filtros,
): Atraccion[] {
  const q = normalizar(filtros.busqueda.trim());
  const deptoDeMunicipio = new Map(
    municipios.map((m) => [m.id, m.departamento_id]),
  );
  return atracciones.filter((a) => {
    if (a.es_casco_urbano) return false;
    if (
      filtros.estilo &&
      !a.estilos.includes(filtros.estilo as (typeof ESTILOS)[number])
    )
      return false;
    if (
      filtros.departamento &&
      deptoDeMunicipio.get(a.municipio_id) !== filtros.departamento
    )
      return false;
    if (q && !normalizar(a.nombre).includes(q)) return false;
    return true;
  });
}

/**
 * Municipios que pasan los filtros. Con filtro de estilo, solo quedan los que
 * tienen alguna atracción de ese estilo. La búsqueda coincide con el nombre del
 * municipio o de alguna de sus atracciones visibles.
 */
export function municipiosFiltrados(
  municipios: Municipio[],
  atraccionesPorMunicipio: Map<string, Atraccion[]>,
  filtros: Filtros,
): Municipio[] {
  const q = normalizar(filtros.busqueda.trim());
  return municipios.filter((m) => {
    if (filtros.departamento && m.departamento_id !== filtros.departamento)
      return false;
    if (
      filtros.estilo &&
      (atraccionesPorMunicipio.get(m.id)?.length ?? 0) === 0
    )
      return false;
    if (q) {
      const coincideMunicipio = normalizar(m.nombre).includes(q);
      const coincideAtraccion = (atraccionesPorMunicipio.get(m.id) ?? []).some(
        (a) => normalizar(a.nombre).includes(q),
      );
      if (!coincideMunicipio && !coincideAtraccion) return false;
    }
    return true;
  });
}
