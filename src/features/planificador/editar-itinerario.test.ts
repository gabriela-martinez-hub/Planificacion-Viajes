// Pruebas de las ediciones del itinerario en memoria (T-13): subir/bajar/fijar.
import { describe, it, expect } from 'vitest';
import {
  subirItem,
  bajarItem,
  alternarFijado,
  ordenDestinos,
  moverDestino,
} from './editar-itinerario';
import type { Itinerario, ItemItinerario } from '@/domain/itinerario';

function item(orden: number, descripcion: string): ItemItinerario {
  return {
    orden,
    tipo: 'actividad',
    descripcion,
    duracionMin: 60,
    costoCop: 0,
    fijado: false,
  };
}

function itinerario(): Itinerario {
  return {
    dias: [
      {
        dia: 1,
        fecha: '2026-12-01',
        municipioBaseId: 'salento',
        items: [item(1, 'A'), item(2, 'B'), item(3, 'C')],
        minutosUsados: 180,
        soloTraslado: false,
        lluvioso: false,
      },
    ],
    costos: {
      transporte: 0,
      alojamiento: 0,
      comida: 0,
      entradas: 0,
      actividades: 0,
      total: 0,
    },
    municipiosInalcanzables: [],
    avisos: [],
  };
}

const descripciones = (it: Itinerario) =>
  it.dias[0].items.map((i) => i.descripcion);

describe('editar-itinerario', () => {
  it('sube un ítem e intercambia con el anterior, renumerando', () => {
    const r = subirItem(itinerario(), 1, 2); // sube B
    expect(descripciones(r)).toEqual(['B', 'A', 'C']);
    expect(r.dias[0].items.map((i) => i.orden)).toEqual([1, 2, 3]);
  });

  it('no sube el primer ítem', () => {
    const r = subirItem(itinerario(), 1, 1);
    expect(descripciones(r)).toEqual(['A', 'B', 'C']);
  });

  it('baja un ítem e intercambia con el siguiente', () => {
    const r = bajarItem(itinerario(), 1, 2); // baja B
    expect(descripciones(r)).toEqual(['A', 'C', 'B']);
  });

  it('no baja el último ítem', () => {
    const r = bajarItem(itinerario(), 1, 3);
    expect(descripciones(r)).toEqual(['A', 'B', 'C']);
  });

  it('alterna el estado fijado de un ítem', () => {
    const r1 = alternarFijado(itinerario(), 1, 2);
    expect(r1.dias[0].items[1].fijado).toBe(true);
    const r2 = alternarFijado(r1, 1, 2);
    expect(r2.dias[0].items[1].fijado).toBe(false);
  });

  it('no muta el itinerario original', () => {
    const original = itinerario();
    subirItem(original, 1, 2);
    expect(descripciones(original)).toEqual(['A', 'B', 'C']);
  });
});

describe('orden de destinos', () => {
  function itinerarioMulti(): Itinerario {
    const dia = (n: number, base: string): Itinerario['dias'][number] => ({
      dia: n,
      fecha: `2026-12-0${n}`,
      municipioBaseId: base,
      items: [],
      minutosUsados: 0,
      soloTraslado: false,
      lluvioso: false,
    });
    return {
      dias: [dia(1, 'salento'), dia(2, 'salento'), dia(3, 'filandia')],
      costos: {
        transporte: 0,
        alojamiento: 0,
        comida: 0,
        entradas: 0,
        actividades: 0,
        total: 0,
      },
      municipiosInalcanzables: [],
      avisos: [],
    };
  }

  it('lista los municipios base distintos en orden de aparición', () => {
    expect(ordenDestinos(itinerarioMulti())).toEqual(['salento', 'filandia']);
  });

  it('mueve un destino hacia abajo', () => {
    const r = moverDestino(['salento', 'filandia'], 'salento', 'abajo');
    expect(r).toEqual(['filandia', 'salento']);
  });

  it('mueve un destino hacia arriba', () => {
    const r = moverDestino(['salento', 'filandia'], 'filandia', 'arriba');
    expect(r).toEqual(['filandia', 'salento']);
  });

  it('no mueve el primero hacia arriba ni el último hacia abajo', () => {
    expect(moverDestino(['a', 'b'], 'a', 'arriba')).toEqual(['a', 'b']);
    expect(moverDestino(['a', 'b'], 'b', 'abajo')).toEqual(['a', 'b']);
  });
});
