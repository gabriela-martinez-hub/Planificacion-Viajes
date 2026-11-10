// Pruebas del borrador local en IndexedDB (T-14, pieza B).
// fake-indexeddb/auto instala una implementación de IndexedDB en el entorno de
// pruebas (jsdom no la trae).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  guardarBorrador,
  leerBorrador,
  borrarBorrador,
} from './borrador-local';
import type { Itinerario } from '@/domain/itinerario';
import type { FormularioViaje } from '@/domain/viaje/esquemas';

const formulario: FormularioViaje = {
  titulo: 'Borrador sin cuenta',
  origenNodoId: 'armenia',
  fechaInicio: '2026-12-01',
  fechaFin: '2026-12-02',
  incluyeRegreso: true,
  viajeros: 1,
  estilos: [],
  nivel: 'economico',
  municipiosElegidos: ['salento'],
  atraccionesObligatorias: [],
  limiteJornadaMin: 540,
  modoPresupuesto: 'fijo',
};

const itinerario: Itinerario = {
  dias: [
    {
      dia: 1,
      fecha: '2026-12-01',
      municipioBaseId: 'salento',
      items: [],
      minutosUsados: 0,
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

describe('borrador local (IndexedDB)', () => {
  beforeEach(async () => {
    await borrarBorrador();
  });

  it('no hay borrador al inicio', async () => {
    expect(await leerBorrador()).toBeNull();
  });

  it('guarda y recupera el borrador', async () => {
    await guardarBorrador(formulario, itinerario);
    const b = await leerBorrador();
    expect(b).not.toBeNull();
    expect(b!.formulario.titulo).toBe('Borrador sin cuenta');
    expect(b!.itinerario.dias).toHaveLength(1);
    expect(typeof b!.guardadoEn).toBe('string');
  });

  it('reemplaza el borrador anterior (solo uno a la vez)', async () => {
    await guardarBorrador(formulario, itinerario);
    await guardarBorrador({ ...formulario, titulo: 'Otro' }, itinerario);
    const b = await leerBorrador();
    expect(b!.formulario.titulo).toBe('Otro');
  });

  it('borra el borrador', async () => {
    await guardarBorrador(formulario, itinerario);
    await borrarBorrador();
    expect(await leerBorrador()).toBeNull();
  });
});
