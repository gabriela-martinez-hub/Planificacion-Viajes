// Pruebas de armarClimaViaje (T-18): combina el municipio base de cada día con
// el pronóstico/promedio de ESE municipio para producir el detalle por día.

import { describe, it, expect } from 'vitest';
import type { ClimaMensual } from '../catalogo/esquemas';
import { armarClimaViaje } from './armar-viaje';
import type { PronosticoDia } from './tipos';

function pron(fecha: string, probabilidadPct: number): PronosticoDia {
  return {
    fecha,
    precipitacionMm: 0,
    probabilidadPct,
    tempMin: 14,
    tempMax: 24,
  };
}

function climaMes(
  municipioId: string,
  mes: number,
  prob: number,
): ClimaMensual {
  return {
    municipio_id: municipioId,
    mes,
    precip_mm: 100,
    dias_lluvia: 15,
    prob_lluvia: prob,
    temp_min: 12,
    temp_max: 22,
    temporada_relativa: prob >= 0.6 ? 'mas_lluviosa' : 'menos_lluviosa',
  };
}

describe('armarClimaViaje', () => {
  const hoy = '2026-12-01';

  it('usa el pronóstico del municipio base de cada día', () => {
    const detalles = armarClimaViaje({
      dias: [
        { fecha: '2026-12-02', municipioBaseId: 'salento' },
        { fecha: '2026-12-03', municipioBaseId: 'filandia' },
      ],
      hoy,
      pronosticoPorMunicipio: new Map([
        ['salento', [pron('2026-12-02', 80)]], // lluvioso
        ['filandia', [pron('2026-12-03', 10)]], // seco
      ]),
      promedioPorMunicipio: new Map(),
    });
    expect(detalles[0]).toMatchObject({ fecha: '2026-12-02', lluvioso: true });
    expect(detalles[1]).toMatchObject({ fecha: '2026-12-03', lluvioso: false });
  });

  it('cae al promedio del municipio cuando no hay pronóstico', () => {
    const detalles = armarClimaViaje({
      dias: [{ fecha: '2026-12-02', municipioBaseId: 'salento' }],
      hoy,
      pronosticoPorMunicipio: new Map(),
      promedioPorMunicipio: new Map([
        ['salento', [climaMes('salento', 12, 0.7)]],
      ]),
    });
    expect(detalles[0].fuente).toBe('promedio');
    expect(detalles[0].lluvioso).toBe(true);
  });

  it('mantiene el orden de los días de entrada', () => {
    const detalles = armarClimaViaje({
      dias: [
        { fecha: '2026-12-03', municipioBaseId: 'salento' },
        { fecha: '2026-12-02', municipioBaseId: 'salento' },
      ],
      hoy,
      pronosticoPorMunicipio: new Map([
        ['salento', [pron('2026-12-02', 10), pron('2026-12-03', 90)]],
      ]),
      promedioPorMunicipio: new Map(),
    });
    expect(detalles.map((d) => d.fecha)).toEqual(['2026-12-03', '2026-12-02']);
    expect(detalles[0].lluvioso).toBe(true); // 2026-12-03, 90%
    expect(detalles[1].lluvioso).toBe(false); // 2026-12-02, 10%
  });

  it('día sin datos queda seco', () => {
    const detalles = armarClimaViaje({
      dias: [{ fecha: '2026-12-02', municipioBaseId: 'salento' }],
      hoy,
      pronosticoPorMunicipio: new Map(),
      promedioPorMunicipio: new Map(),
    });
    expect(detalles[0].lluvioso).toBe(false);
    expect(detalles[0].probabilidadLluvia).toBe(0);
  });
});
