// Grafo de rutas de bus y caminos más cortos (plan.md 6.1 paso 3).
//
// Las rutas directas (`rutas_bus`) son las aristas. El camino entre dos nodos
// se calcula con Dijkstra minimizando minutos, con una penalización de 30 min
// por trasbordo (cada arista intermedia después de la primera). El costo en
// pesos del camino es la suma de las tarifas de sus tramos.
//
// Funciones puras y deterministas: el desempate de la cola de prioridad usa el
// id del nodo, de modo que la misma entrada produce el mismo camino.

import type { RutaBus } from '../catalogo/esquemas';

/** Penalización de tiempo por cada trasbordo (plan.md 6.1 paso 3). */
export const PENALIZACION_TRASBORDO_MIN = 30;

export interface Camino {
  /** Secuencia de nodos, desde el origen hasta el destino inclusive. */
  nodos: string[];
  /** Minutos de bus más la penalización por trasbordo. */
  minutos: number;
  /** Minutos de bus reales (sin la penalización), para mostrar al usuario. */
  minutosBus: number;
  /** Suma de tarifas de los tramos, por persona, en COP. */
  tarifaCop: number;
  /** Número de trasbordos (tramos - 1). */
  trasbordos: number;
}

interface Arista {
  destino: string;
  minutos: number;
  tarifaCop: number;
}

/** Grafo de adyacencia construido una vez y reutilizado para varias consultas. */
export class GrafoBuses {
  private readonly adyacencia = new Map<string, Arista[]>();

  constructor(rutas: RutaBus[]) {
    for (const r of rutas) {
      this.agregar(r.nodo_origen, {
        destino: r.nodo_destino,
        minutos: r.minutos,
        tarifaCop: r.tarifa_cop,
      });
    }
    // Orden estable de las aristas por destino, para que Dijkstra sea determinista.
    for (const aristas of this.adyacencia.values()) {
      aristas.sort((a, b) => a.destino.localeCompare(b.destino));
    }
  }

  private agregar(origen: string, arista: Arista): void {
    const lista = this.adyacencia.get(origen);
    if (lista) lista.push(arista);
    else this.adyacencia.set(origen, [arista]);
  }

  /** true si el nodo tiene al menos una arista en el grafo. */
  tieneNodo(id: string): boolean {
    return this.adyacencia.has(id);
  }

  /**
   * Camino más corto en minutos (con penalización por trasbordo) de `origen` a
   * `destino`. Devuelve null si no hay camino. Si origen = destino devuelve un
   * camino vacío con costo 0.
   */
  caminoMasCorto(origen: string, destino: string): Camino | null {
    if (origen === destino) {
      return {
        nodos: [origen],
        minutos: 0,
        minutosBus: 0,
        tarifaCop: 0,
        trasbordos: 0,
      };
    }
    if (!this.adyacencia.has(origen)) return null;

    // Estado por nodo: mejor costo (con penalización), minutos de bus, tarifa,
    // número de tramos recorridos y predecesor.
    const dist = new Map<string, number>();
    const minutosBus = new Map<string, number>();
    const tarifa = new Map<string, number>();
    const tramos = new Map<string, number>();
    const previo = new Map<string, string>();
    const visitado = new Set<string>();

    dist.set(origen, 0);
    minutosBus.set(origen, 0);
    tarifa.set(origen, 0);
    tramos.set(origen, 0);

    // Cola simple: se extrae el no visitado con menor distancia, desempatando
    // por id para que el resultado sea determinista.
    let quedan = true;
    while (quedan) {
      let actual: string | undefined;
      let mejor = Infinity;
      for (const [nodo, d] of dist) {
        if (visitado.has(nodo)) continue;
        if (
          d < mejor ||
          (d === mejor && (actual === undefined || nodo < actual))
        ) {
          mejor = d;
          actual = nodo;
        }
      }
      if (actual === undefined) {
        quedan = false; // no quedan nodos alcanzables
        break;
      }
      if (actual === destino) break;
      visitado.add(actual);

      const aristas = this.adyacencia.get(actual) ?? [];
      const tramosActual = tramos.get(actual) ?? 0;
      for (const arista of aristas) {
        if (visitado.has(arista.destino)) continue;
        // La penalización se aplica a cada tramo salvo el primero.
        const penalizacion = tramosActual >= 1 ? PENALIZACION_TRASBORDO_MIN : 0;
        const nuevaDist = mejor + arista.minutos + penalizacion;
        const distActual = dist.get(arista.destino) ?? Infinity;
        if (nuevaDist < distActual) {
          dist.set(arista.destino, nuevaDist);
          minutosBus.set(
            arista.destino,
            (minutosBus.get(actual) ?? 0) + arista.minutos,
          );
          tarifa.set(
            arista.destino,
            (tarifa.get(actual) ?? 0) + arista.tarifaCop,
          );
          tramos.set(arista.destino, tramosActual + 1);
          previo.set(arista.destino, actual);
        }
      }
    }

    if (!dist.has(destino)) return null;

    // Reconstruir el camino.
    const nodos: string[] = [];
    let n: string | undefined = destino;
    while (n !== undefined) {
      nodos.unshift(n);
      n = previo.get(n);
    }

    const totalTramos = tramos.get(destino) ?? 0;
    return {
      nodos,
      minutos: dist.get(destino) ?? 0,
      minutosBus: minutosBus.get(destino) ?? 0,
      tarifaCop: tarifa.get(destino) ?? 0,
      trasbordos: Math.max(0, totalTramos - 1),
    };
  }
}
