// Pruebas del servicio de clima (T-17, plan.md 6.3).
//
// Prueban obtenerPronostico con un fetch inyectado (sin red real): el armado de
// la URL, la normalización de la respuesta (objeto para un lugar, arreglo para
// varios), el manejo de nulos y los resultados tipados de error. obtenerClimaMensual
// usa Supabase y se cubre en la prueba de integración / el dominio.

import { describe, it, expect, vi } from 'vitest';
import { obtenerPronostico, type Lugar } from './clima';

function respuestaLugar(fecha: string, probabilidad: number, precip: number) {
  return {
    latitude: 4.5,
    longitude: -75.6,
    daily: {
      time: [fecha],
      precipitation_sum: [precip],
      precipitation_probability_max: [probabilidad],
      temperature_2m_max: [25],
      temperature_2m_min: [15],
    },
  };
}

function fetchOk(cuerpo: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(cuerpo),
  }) as unknown as typeof fetch;
}

const salento: Lugar = { id: 'salento', lat: 4.637, lon: -75.57 };
const filandia: Lugar = { id: 'filandia', lat: 4.674, lon: -75.661 };

describe('obtenerPronostico', () => {
  it('devuelve vacío sin lugares, sin llamar a la red', async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch;
    const r = await obtenerPronostico([], fetchFn);
    expect(r.ok && r.datos).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('normaliza la respuesta de un solo lugar (objeto) a un arreglo', async () => {
    const fetchFn = fetchOk(respuestaLugar('2026-12-03', 80, 10));
    const r = await obtenerPronostico([salento], fetchFn);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos).toHaveLength(1);
    expect(r.datos[0].id).toBe('salento');
    expect(r.datos[0].dias[0]).toMatchObject({
      fecha: '2026-12-03',
      probabilidadPct: 80,
      precipitacionMm: 10,
    });
  });

  it('asocia por índice la respuesta de varios lugares (arreglo)', async () => {
    const fetchFn = fetchOk([
      respuestaLugar('2026-12-03', 10, 0),
      respuestaLugar('2026-12-03', 90, 20),
    ]);
    const r = await obtenerPronostico([salento, filandia], fetchFn);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos.map((d) => d.id)).toEqual(['salento', 'filandia']);
    expect(r.datos[1].dias[0].probabilidadPct).toBe(90);
  });

  it('pide forecast_days=16, timezone y las variables diarias', async () => {
    const fetchFn = fetchOk(respuestaLugar('2026-12-03', 0, 0));
    await obtenerPronostico([salento], fetchFn);
    const url = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(url).toContain('forecast_days=16');
    expect(url).toContain('timezone=America%2FBogota');
    expect(url).toContain('precipitation_probability_max');
    expect(url).toContain('latitude=4.637');
  });

  it('convierte nulos de la API en 0', async () => {
    const cuerpo = {
      latitude: 4.5,
      longitude: -75.6,
      daily: {
        time: ['2026-12-03'],
        precipitation_sum: [null],
        precipitation_probability_max: [null],
        temperature_2m_max: [null],
        temperature_2m_min: [null],
      },
    };
    const r = await obtenerPronostico([salento], fetchOk(cuerpo));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos[0].dias[0]).toMatchObject({
      precipitacionMm: 0,
      probabilidadPct: 0,
    });
  });

  it('devuelve ok:false si la API responde con error HTTP', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;
    const r = await obtenerPronostico([salento], fetchFn);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain('429');
  });

  it('devuelve ok:false si la red falla', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValue(
        new Error('conexión caída'),
      ) as unknown as typeof fetch;
    const r = await obtenerPronostico([salento], fetchFn);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain('conexión caída');
  });

  it('devuelve ok:false si la respuesta no cumple el esquema', async () => {
    const r = await obtenerPronostico([salento], fetchOk({ foo: 'bar' }));
    expect(r.ok).toBe(false);
  });

  it('devuelve ok:false si el número de lugares no coincide', async () => {
    // Se piden dos lugares pero la API devuelve uno.
    const fetchFn = fetchOk(respuestaLugar('2026-12-03', 0, 0));
    const r = await obtenerPronostico([salento, filandia], fetchFn);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain('se esperaban 2');
  });
});
