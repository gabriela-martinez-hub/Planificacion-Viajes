// Validación de consistencia del catálogo más allá de Zod: claves foráneas,
// unicidades e invariantes del grafo de buses. Zod valida cada fila por separado;
// esto valida las relaciones entre tablas, como harían las FK del SQL.
//
// Es funciones puras sobre un Catalogo ya validado por catalogoSchema. El script
// de carga (scripts/cargar-seed.ts) y las pruebas las usan.

import type { Catalogo } from './esquemas';

export interface ProblemaCatalogo {
  tabla: string;
  id: string;
  problema: string;
}

/** Nodos alcanzables desde un municipio cabecera por el grafo de buses no dirigido. */
function componenteConexa(
  inicio: string,
  adyacencia: Map<string, Set<string>>,
): Set<string> {
  const vistos = new Set<string>([inicio]);
  const pila = [inicio];
  while (pila.length > 0) {
    const actual = pila.pop() as string;
    for (const vecino of adyacencia.get(actual) ?? []) {
      if (!vistos.has(vecino)) {
        vistos.add(vecino);
        pila.push(vecino);
      }
    }
  }
  return vistos;
}

/**
 * Revisa integridad referencial y unicidades. Devuelve la lista de problemas
 * (vacía si todo está bien). No lanza: el llamador decide qué hacer.
 */
export function validarReferencias(cat: Catalogo): ProblemaCatalogo[] {
  const problemas: ProblemaCatalogo[] = [];

  const departamentos = new Set(cat.departamentos.map((d) => d.id));
  const municipios = new Set(cat.municipios.map((m) => m.id));
  const externos = new Set(cat.origenes_externos.map((e) => e.id));
  const nodos = new Set([...municipios, ...externos]);
  const atracciones = new Set(cat.atracciones.map((a) => a.id));
  const rutas = new Set(cat.rutas_tematicas.map((r) => r.id));

  const unico = (
    tabla: string,
    valores: string[],
    descripcion = 'id repetido',
  ) => {
    const vistos = new Set<string>();
    for (const v of valores) {
      if (vistos.has(v)) {
        problemas.push({ tabla, id: v, problema: descripcion });
      }
      vistos.add(v);
    }
  };

  // Unicidad de ids principales.
  unico(
    'departamentos',
    cat.departamentos.map((d) => d.id),
  );
  unico(
    'municipios',
    cat.municipios.map((m) => m.id),
  );
  unico(
    'municipios',
    cat.municipios.map((m) => m.codigo_dane),
    'codigo_dane repetido',
  );
  unico(
    'atracciones',
    cat.atracciones.map((a) => a.id),
  );
  unico(
    'rutas_tematicas',
    cat.rutas_tematicas.map((r) => r.id),
  );
  unico(
    'insignias',
    cat.insignias.map((b) => b.id),
  );

  // Municipios: departamento existente.
  for (const m of cat.municipios) {
    if (!departamentos.has(m.departamento_id)) {
      problemas.push({
        tabla: 'municipios',
        id: m.id,
        problema: `departamento inexistente: ${m.departamento_id}`,
      });
    }
  }

  // Un municipio y un origen externo no pueden compartir id (son nodos únicos).
  for (const e of externos) {
    if (municipios.has(e)) {
      problemas.push({
        tabla: 'origenes_externos',
        id: e,
        problema: 'el id coincide con un municipio',
      });
    }
  }

  // Atracciones: municipio existente, un solo casco urbano por municipio.
  const cascoPorMunicipio = new Map<string, number>();
  for (const a of cat.atracciones) {
    if (!municipios.has(a.municipio_id)) {
      problemas.push({
        tabla: 'atracciones',
        id: a.id,
        problema: `municipio inexistente: ${a.municipio_id}`,
      });
    }
    if (a.es_casco_urbano) {
      cascoPorMunicipio.set(
        a.municipio_id,
        (cascoPorMunicipio.get(a.municipio_id) ?? 0) + 1,
      );
    }
  }
  for (const [mun, n] of cascoPorMunicipio) {
    if (n > 1) {
      problemas.push({
        tabla: 'atracciones',
        id: mun,
        problema: `tiene ${n} cascos urbanos (debe haber 1)`,
      });
    }
  }

  // Rutas de bus: nodos existentes y sin par repetido.
  const paresBus = new Set<string>();
  for (const r of cat.rutas_bus) {
    for (const n of [r.nodo_origen, r.nodo_destino]) {
      if (!nodos.has(n)) {
        problemas.push({
          tabla: 'rutas_bus',
          id: `${r.nodo_origen}->${r.nodo_destino}`,
          problema: `nodo inexistente: ${n}`,
        });
      }
    }
    const par = `${r.nodo_origen}->${r.nodo_destino}`;
    if (paresBus.has(par)) {
      problemas.push({ tabla: 'rutas_bus', id: par, problema: 'par repetido' });
    }
    paresBus.add(par);
  }

  // Tarifas: municipio existente si no es regional.
  for (const t of cat.tarifas_referencia) {
    if (t.municipio_id !== undefined && !municipios.has(t.municipio_id)) {
      problemas.push({
        tabla: 'tarifas_referencia',
        id: `${t.concepto}/${t.nivel}/${t.municipio_id}`,
        problema: `municipio inexistente: ${t.municipio_id}`,
      });
    }
  }

  // Clima: municipio existente, 12 meses por municipio sin repetir.
  const mesesPorMunicipio = new Map<string, Set<number>>();
  for (const c of cat.clima_mensual) {
    if (!municipios.has(c.municipio_id)) {
      problemas.push({
        tabla: 'clima_mensual',
        id: `${c.municipio_id}/${c.mes}`,
        problema: `municipio inexistente: ${c.municipio_id}`,
      });
    }
    const meses = mesesPorMunicipio.get(c.municipio_id) ?? new Set<number>();
    if (meses.has(c.mes)) {
      problemas.push({
        tabla: 'clima_mensual',
        id: `${c.municipio_id}/${c.mes}`,
        problema: 'mes repetido',
      });
    }
    meses.add(c.mes);
    mesesPorMunicipio.set(c.municipio_id, meses);
  }

  // Ruta items: ruta existente y la referencia (municipio o atracción) existe.
  for (const i of cat.ruta_items) {
    if (!rutas.has(i.ruta_id)) {
      problemas.push({
        tabla: 'ruta_items',
        id: i.ruta_id,
        problema: `ruta inexistente: ${i.ruta_id}`,
      });
    }
    if (i.municipio_id !== undefined && !municipios.has(i.municipio_id)) {
      problemas.push({
        tabla: 'ruta_items',
        id: `${i.ruta_id}/${i.municipio_id}`,
        problema: `municipio inexistente: ${i.municipio_id}`,
      });
    }
    if (i.atraccion_id !== undefined && !atracciones.has(i.atraccion_id)) {
      problemas.push({
        tabla: 'ruta_items',
        id: `${i.ruta_id}/${i.atraccion_id}`,
        problema: `atracción inexistente: ${i.atraccion_id}`,
      });
    }
  }

  // Insignias: la referencia de su tipo existe.
  for (const b of cat.insignias) {
    if (b.municipio_id !== undefined && !municipios.has(b.municipio_id)) {
      problemas.push({
        tabla: 'insignias',
        id: b.id,
        problema: `municipio inexistente: ${b.municipio_id}`,
      });
    }
    if (b.atraccion_id !== undefined && !atracciones.has(b.atraccion_id)) {
      problemas.push({
        tabla: 'insignias',
        id: b.id,
        problema: `atracción inexistente: ${b.atraccion_id}`,
      });
    }
    if (
      b.departamento_id !== undefined &&
      !departamentos.has(b.departamento_id)
    ) {
      problemas.push({
        tabla: 'insignias',
        id: b.id,
        problema: `departamento inexistente: ${b.departamento_id}`,
      });
    }
    if (b.ruta_id !== undefined && !rutas.has(b.ruta_id)) {
      problemas.push({
        tabla: 'insignias',
        id: b.id,
        problema: `ruta inexistente: ${b.ruta_id}`,
      });
    }
  }

  return problemas;
}

export interface ConectividadBus {
  /** Municipios alcanzables entre sí por carretera (una sola componente). */
  alcanzables: string[];
  /** Municipios sin ningún camino de bus hacia la mayor componente. */
  aislados: string[];
  /** true si todos los municipios quedan en la misma componente conexa. */
  todosConectados: boolean;
}

/**
 * Analiza el grafo de buses (no dirigido para conectividad) y reporta qué
 * municipios quedan conectados y cuáles aislados. Criterio de aceptación de F-a:
 * "el grafo conecta todos los municipios con cabecera alcanzable por carretera,
 * y los que no, quedan listados".
 */
export function analizarConectividadBus(cat: Catalogo): ConectividadBus {
  const municipios = cat.municipios.map((m) => m.id);
  const municipioSet = new Set(municipios);

  const adyacencia = new Map<string, Set<string>>();
  for (const m of municipios) adyacencia.set(m, new Set());
  for (const r of cat.rutas_bus) {
    // Solo aristas entre municipios cuentan para la conectividad del catálogo
    // (los orígenes externos son puntos de entrada, no destinos a visitar).
    if (municipioSet.has(r.nodo_origen) && municipioSet.has(r.nodo_destino)) {
      adyacencia.get(r.nodo_origen)?.add(r.nodo_destino);
      adyacencia.get(r.nodo_destino)?.add(r.nodo_origen);
    }
  }

  if (municipios.length === 0) {
    return { alcanzables: [], aislados: [], todosConectados: true };
  }

  // Mayor componente conexa: se toma como la red principal de carretera.
  let mayor = new Set<string>();
  const pendientes = new Set(municipios);
  while (pendientes.size > 0) {
    const inicio = pendientes.values().next().value as string;
    const comp = componenteConexa(inicio, adyacencia);
    for (const n of comp) pendientes.delete(n);
    if (comp.size > mayor.size) mayor = comp;
  }

  const alcanzables = municipios.filter((m) => mayor.has(m)).sort();
  const aislados = municipios.filter((m) => !mayor.has(m)).sort();
  return {
    alcanzables,
    aislados,
    todosConectados: aislados.length === 0,
  };
}
