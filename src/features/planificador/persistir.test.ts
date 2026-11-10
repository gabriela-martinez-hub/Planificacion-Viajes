// Pruebas de la serialización/reconstrucción de viajes (T-14, pieza A).
import { describe, it, expect } from 'vitest';
import {
  serializarViaje,
  reconstruirItinerario,
  type ViajeItemFila,
} from './persistir';
import type { Itinerario } from '@/domain/itinerario';
import type { FormularioViaje } from '@/domain/viaje/esquemas';

const formulario: FormularioViaje = {
  titulo: 'Viaje de prueba',
  origenNodoId: 'armenia',
  fechaInicio: '2026-12-01',
  fechaFin: '2026-12-02',
  incluyeRegreso: true,
  viajeros: 2,
  estilos: ['naturaleza'],
  nivel: 'economico',
  municipiosElegidos: ['salento'],
  atraccionesObligatorias: [],
  limiteJornadaMin: 540,
  modoPresupuesto: 'fijo',
};

function itinerario(): Itinerario {
  return {
    dias: [
      {
        dia: 1,
        fecha: '2026-12-01',
        municipioBaseId: 'salento',
        items: [
          {
            orden: 1,
            tipo: 'traslado',
            descripcion: 'Bus Armenia → Salento',
            duracionMin: 45,
            costoCop: 15000,
            fijado: false,
          },
          {
            orden: 2,
            tipo: 'actividad',
            atraccionId: 'valle-de-cocora',
            descripcion: 'Valle de Cocora',
            duracionMin: 240,
            costoCop: 20000,
            fijado: true,
          },
        ],
        minutosUsados: 285,
        soloTraslado: false,
        lluvioso: false,
      },
    ],
    costos: {
      transporte: 15000,
      alojamiento: 0,
      comida: 0,
      entradas: 20000,
      actividades: 0,
      total: 35000,
    },
    municipiosInalcanzables: [],
    avisos: [],
  };
}

describe('serializarViaje', () => {
  it('arma las filas de viaje, días e ítems', () => {
    const p = serializarViaje(formulario, itinerario());
    expect(p.viaje.titulo).toBe('Viaje de prueba');
    expect(p.viaje.estado).toBe('planeado');
    expect(p.dias).toHaveLength(1);
    expect(p.dias[0].municipio_base_id).toBe('salento');
    expect(p.items).toHaveLength(2);
  });

  it('solo las actividades conservan atraccion_id', () => {
    const p = serializarViaje(formulario, itinerario());
    const traslado = p.items.find((i) => i.tipo === 'traslado');
    const actividad = p.items.find((i) => i.tipo === 'actividad');
    expect(traslado?.atraccion_id).toBeUndefined();
    expect(actividad?.atraccion_id).toBe('valle-de-cocora');
  });

  it('conserva el estado fijado y los costos de los ítems', () => {
    const p = serializarViaje(formulario, itinerario());
    const actividad = p.items.find((i) => i.tipo === 'actividad');
    expect(actividad?.fijado).toBe(true);
    expect(actividad?.costo_estimado_cop).toBe(20000);
  });
});

describe('reconstruirItinerario', () => {
  const descripcion = (it: ViajeItemFila) => it.atraccion_id ?? `(${it.tipo})`;

  it('reconstruye días e ítems ordenados y suma costos por tipo', () => {
    const p = serializarViaje(formulario, itinerario());
    const it = reconstruirItinerario(
      p.dias.map((d) => ({
        dia: d.dia,
        municipio_base_id: d.municipio_base_id,
      })),
      p.items.map((i) => ({
        dia: i.dia,
        orden: i.orden,
        atraccion_id: i.atraccion_id ?? null,
        tipo: i.tipo,
        duracion_min: i.duracion_min,
        costo_estimado_cop: i.costo_estimado_cop,
        fijado: i.fijado,
      })),
      descripcion,
    );
    expect(it.dias).toHaveLength(1);
    expect(it.dias[0].items.map((i) => i.orden)).toEqual([1, 2]);
    expect(it.costos.transporte).toBe(15000);
    expect(it.costos.entradas).toBe(20000);
    expect(it.costos.total).toBe(35000);
  });

  it('marca el día como solo traslado si no tiene actividades', () => {
    const it = reconstruirItinerario(
      [{ dia: 1, municipio_base_id: 'salento' }],
      [
        {
          dia: 1,
          orden: 1,
          atraccion_id: null,
          tipo: 'traslado',
          duracion_min: 480,
          costo_estimado_cop: 75000,
          fijado: false,
        },
      ],
      descripcion,
    );
    expect(it.dias[0].soloTraslado).toBe(true);
  });
});
