// Pruebas de la reorganización por clima (T-18, plan.md 6.1 paso 9).
//
// Verifican que reorganizarPorClima: reproyecta la lluvia desde climaPorDia,
// mueve actividades al aire libre de días lluviosos a días secos con la misma
// base, respeta los ítems fijados, no cambia el costo total, es determinista y
// reporta correctamente si hubo cambios (para la vista previa).

import { describe, it, expect } from 'vitest';
import type { Atraccion } from '../catalogo/esquemas';
import { reorganizarPorClima } from './reorganizar-clima';
import type { DiaItinerario, Itinerario, ItemItinerario } from './tipos';

function atr(id: string, alAireLibre: boolean): Atraccion {
  return {
    id,
    municipio_id: 'pueblo',
    nombre: id,
    categoria: 'x',
    lat: 4.5,
    lon: -75.6,
    es_casco_urbano: false,
    costo_entrada_cop: 0,
    costo_aproximado: true,
    duracion_min: 120,
    minutos_desde_casco: 0,
    transporte_local_cop: 0,
    dias_cerrado: [],
    al_aire_libre: alAireLibre,
    estilos: [],
    requiere_guia: false,
    estado_acceso: 'abierta',
    radio_checkin_m: 300,
    descripcion: '',
    fecha_actualizacion: '2026-11-01',
    fuente: 'test',
  };
}

function actividad(
  orden: number,
  atraccionId: string,
  fijado = false,
): ItemItinerario {
  return {
    orden,
    tipo: 'actividad',
    atraccionId,
    descripcion: atraccionId,
    duracionMin: 120,
    costoCop: 10000,
    fijado,
  };
}

function dia(
  numero: number,
  fecha: string,
  items: ItemItinerario[],
  lluvioso = false,
): DiaItinerario {
  return {
    dia: numero,
    fecha,
    municipioBaseId: 'pueblo',
    items,
    minutosUsados: items.reduce((s, it) => s + it.duracionMin, 0),
    soloTraslado: false,
    lluvioso,
  };
}

/** Itinerario de 2 días en el mismo municipio: día 1 con 1 actividad al aire
 *  libre, día 2 con 1 actividad bajo techo. */
function itinerarioBase(): Itinerario {
  return {
    dias: [
      dia(1, '2026-12-01', [actividad(1, 'mirador')]), // aire libre
      dia(2, '2026-12-02', [actividad(1, 'museo')]), // bajo techo
    ],
    costos: {
      transporte: 0,
      alojamiento: 0,
      comida: 0,
      entradas: 20000,
      actividades: 0,
      total: 20000,
    },
    municipiosInalcanzables: [],
    avisos: [],
  };
}

const atracciones = [atr('mirador', true), atr('museo', false)];

describe('reorganizarPorClima', () => {
  it('mueve la actividad al aire libre del día lluvioso al día seco', () => {
    const it = itinerarioBase();
    // Día 1 lluvioso, día 2 seco: el mirador (aire libre) debe pasar al día 2.
    const r = reorganizarPorClima(it, {
      atracciones,
      climaPorDia: [
        { fecha: '2026-12-01', lluvioso: true },
        { fecha: '2026-12-02', lluvioso: false },
      ],
    });
    expect(r.cambio).toBe(true);
    const dia2 = r.candidato.dias.find((d) => d.dia === 2)!;
    expect(dia2.items.some((i) => i.atraccionId === 'mirador')).toBe(true);
    const dia1 = r.candidato.dias.find((d) => d.dia === 1)!;
    expect(dia1.items.some((i) => i.atraccionId === 'mirador')).toBe(false);
  });

  it('no cambia el costo total', () => {
    const it = itinerarioBase();
    const r = reorganizarPorClima(it, {
      atracciones,
      climaPorDia: [
        { fecha: '2026-12-01', lluvioso: true },
        { fecha: '2026-12-02', lluvioso: false },
      ],
    });
    expect(r.candidato.costos.total).toBe(it.costos.total);
  });

  it('no reporta cambios cuando no hay lluvia', () => {
    const it = itinerarioBase();
    const r = reorganizarPorClima(it, {
      atracciones,
      climaPorDia: [
        { fecha: '2026-12-01', lluvioso: false },
        { fecha: '2026-12-02', lluvioso: false },
      ],
    });
    expect(r.cambio).toBe(false);
  });

  it('no mueve una actividad fijada aunque esté bajo la lluvia', () => {
    const it: Itinerario = {
      ...itinerarioBase(),
      dias: [
        dia(1, '2026-12-01', [actividad(1, 'mirador', true)], true), // fijada
        dia(2, '2026-12-02', [actividad(1, 'museo')]),
      ],
    };
    const r = reorganizarPorClima(it, {
      atracciones,
      climaPorDia: [
        { fecha: '2026-12-01', lluvioso: true },
        { fecha: '2026-12-02', lluvioso: false },
      ],
    });
    // El mirador fijado se queda en el día 1.
    const dia1 = r.candidato.dias.find((d) => d.dia === 1)!;
    expect(dia1.items.some((i) => i.atraccionId === 'mirador')).toBe(true);
    expect(r.cambio).toBe(false);
  });

  it('es determinista: misma entrada, mismo candidato', () => {
    const it = itinerarioBase();
    const clima = [
      { fecha: '2026-12-01', lluvioso: true },
      { fecha: '2026-12-02', lluvioso: false },
    ];
    const a = reorganizarPorClima(it, { atracciones, climaPorDia: clima });
    const b = reorganizarPorClima(it, { atracciones, climaPorDia: clima });
    expect(JSON.stringify(a.candidato)).toBe(JSON.stringify(b.candidato));
  });

  it('no muta el itinerario original', () => {
    const it = itinerarioBase();
    const copia = JSON.stringify(it);
    reorganizarPorClima(it, {
      atracciones,
      climaPorDia: [
        { fecha: '2026-12-01', lluvioso: true },
        { fecha: '2026-12-02', lluvioso: false },
      ],
    });
    expect(JSON.stringify(it)).toBe(copia);
  });
});
