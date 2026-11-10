// Pruebas del grafo de buses: Dijkstra con penalización por trasbordo (6.1).
import { describe, it, expect } from 'vitest';
import { GrafoBuses, PENALIZACION_TRASBORDO_MIN } from './grafo-buses';
import type { RutaBus } from '../catalogo/esquemas';

function ruta(de: string, a: string, min: number, tarifa: number): RutaBus {
  // Ambos sentidos, como el seed real.
  return {
    nodo_origen: de,
    nodo_destino: a,
    minutos: min,
    tarifa_cop: tarifa,
    costo_aproximado: true,
    fecha_actualizacion: '2026-11-10',
    fuente: 'test',
  };
}

function bidireccional(
  de: string,
  a: string,
  min: number,
  tarifa: number,
): RutaBus[] {
  return [ruta(de, a, min, tarifa), ruta(a, de, min, tarifa)];
}

describe('GrafoBuses', () => {
  // a - b - c en línea; a - d directo.
  const rutas: RutaBus[] = [
    ...bidireccional('a', 'b', 30, 5000),
    ...bidireccional('b', 'c', 40, 6000),
    ...bidireccional('a', 'd', 100, 12000),
  ];
  const grafo = new GrafoBuses(rutas);

  it('origen igual a destino: camino vacío con costo 0', () => {
    const c = grafo.caminoMasCorto('a', 'a');
    expect(c).not.toBeNull();
    expect(c!.minutos).toBe(0);
    expect(c!.tarifaCop).toBe(0);
    expect(c!.trasbordos).toBe(0);
  });

  it('tramo directo: sin penalización', () => {
    const c = grafo.caminoMasCorto('a', 'b');
    expect(c!.minutos).toBe(30);
    expect(c!.minutosBus).toBe(30);
    expect(c!.tarifaCop).toBe(5000);
    expect(c!.trasbordos).toBe(0);
  });

  it('dos tramos: suma tiempos, tarifas y aplica una penalización de trasbordo', () => {
    const c = grafo.caminoMasCorto('a', 'c');
    expect(c!.minutosBus).toBe(70); // 30 + 40
    expect(c!.minutos).toBe(70 + PENALIZACION_TRASBORDO_MIN);
    expect(c!.tarifaCop).toBe(11000);
    expect(c!.trasbordos).toBe(1);
    expect(c!.nodos).toEqual(['a', 'b', 'c']);
  });

  it('devuelve null cuando no hay camino', () => {
    const c = grafo.caminoMasCorto('a', 'z');
    expect(c).toBeNull();
  });

  it('es determinista en empates de tiempo', () => {
    // Dos caminos de igual tiempo: el desempate por id debe dar el mismo.
    const g = new GrafoBuses([
      ...bidireccional('x', 'm', 50, 1000),
      ...bidireccional('m', 'y', 50, 1000),
      ...bidireccional('x', 'n', 50, 2000),
      ...bidireccional('n', 'y', 50, 2000),
    ]);
    const c1 = g.caminoMasCorto('x', 'y');
    const c2 = g.caminoMasCorto('x', 'y');
    expect(c1!.nodos).toEqual(c2!.nodos);
  });
});
