// Pruebas del dominio de clima (T-17, plan.md 6.3).
//
// Cubren la clasificación de días lluviosos por pronóstico y por promedio, la
// selección de fuente según el horizonte (pronóstico/tendencia/promedio) y los
// casos del criterio de aceptación de la fase (d): fechas a más de 16 días no se
// etiquetan como pronóstico y un viaje que cruza dos meses usa el promedio de
// cada mes.

import { describe, it, expect } from 'vitest';
import type { ClimaMensual } from '../catalogo/esquemas';
import {
  clasificarDias,
  esLluviosoPromedio,
  esLluviosoPronostico,
  aClimaDia,
} from './clasificar';
import type { PronosticoDia } from './tipos';

function pron(
  parcial: Partial<PronosticoDia> & { fecha: string },
): PronosticoDia {
  return {
    precipitacionMm: 0,
    probabilidadPct: 0,
    tempMin: 15,
    tempMax: 25,
    ...parcial,
  };
}

function climaMes(mes: number, probLluvia: number): ClimaMensual {
  return {
    municipio_id: 'salento',
    mes,
    precip_mm: 100,
    dias_lluvia: 15,
    prob_lluvia: probLluvia,
    temp_min: 12,
    temp_max: 22,
    temporada_relativa: probLluvia >= 0.6 ? 'mas_lluviosa' : 'menos_lluviosa',
  };
}

describe('esLluviosoPronostico', () => {
  it('es lluvioso si la probabilidad >= 60 %', () => {
    expect(
      esLluviosoPronostico(pron({ fecha: 'x', probabilidadPct: 60 })),
    ).toBe(true);
    expect(
      esLluviosoPronostico(pron({ fecha: 'x', probabilidadPct: 59 })),
    ).toBe(false);
  });

  it('es lluvioso si la precipitación >= 5 mm aunque la probabilidad sea baja', () => {
    expect(
      esLluviosoPronostico(
        pron({ fecha: 'x', probabilidadPct: 10, precipitacionMm: 5 }),
      ),
    ).toBe(true);
    expect(
      esLluviosoPronostico(
        pron({ fecha: 'x', probabilidadPct: 10, precipitacionMm: 4.9 }),
      ),
    ).toBe(false);
  });

  it('respeta umbrales configurables', () => {
    const umbrales = { probabilidadMin: 0.8, precipitacionMinMm: 10 };
    expect(
      esLluviosoPronostico(pron({ fecha: 'x', probabilidadPct: 70 }), umbrales),
    ).toBe(false);
    expect(
      esLluviosoPronostico(pron({ fecha: 'x', probabilidadPct: 80 }), umbrales),
    ).toBe(true);
  });
});

describe('esLluviosoPromedio', () => {
  it('usa prob_lluvia >= umbral', () => {
    expect(esLluviosoPromedio(climaMes(4, 0.6))).toBe(true);
    expect(esLluviosoPromedio(climaMes(4, 0.59))).toBe(false);
  });
});

describe('clasificarDias: selección de fuente por horizonte', () => {
  const hoy = '2026-12-01';

  it('días dentro de 7 usan pronóstico', () => {
    const r = clasificarDias({
      fechas: ['2026-12-03'],
      hoy,
      pronostico: [pron({ fecha: '2026-12-03', probabilidadPct: 70 })],
      promedioMensual: [],
    });
    expect(r[0].fuente).toBe('pronostico');
    expect(r[0].lluvioso).toBe(true);
  });

  it('días entre 8 y 16 se etiquetan como tendencia', () => {
    const r = clasificarDias({
      fechas: ['2026-12-10'], // día 10 desde hoy
      hoy,
      pronostico: [pron({ fecha: '2026-12-10', probabilidadPct: 20 })],
      promedioMensual: [],
    });
    expect(r[0].fuente).toBe('tendencia');
  });

  it('fechas a más de 16 días nunca se etiquetan como pronóstico (criterio F-d)', () => {
    const r = clasificarDias({
      fechas: ['2026-12-25'], // 24 días desde hoy
      hoy,
      // Aunque la API trajera ese día, está fuera del horizonte: se usa promedio.
      pronostico: [pron({ fecha: '2026-12-25', probabilidadPct: 90 })],
      promedioMensual: [climaMes(12, 0.3)],
    });
    expect(r[0].fuente).toBe('promedio');
    expect(r[0].fuente).not.toBe('pronostico');
    expect(r[0].lluvioso).toBe(false); // del promedio (0.3 < 0.6)
  });

  it('sin pronóstico cae al promedio mensual', () => {
    const r = clasificarDias({
      fechas: ['2026-12-03'],
      hoy,
      pronostico: [],
      promedioMensual: [climaMes(12, 0.7)],
    });
    expect(r[0].fuente).toBe('promedio');
    expect(r[0].lluvioso).toBe(true);
  });

  it('un viaje que cruza dos meses usa el promedio de cada mes (criterio F-d)', () => {
    const r = clasificarDias({
      fechas: ['2026-12-28', '2027-01-02'], // ambos fuera del horizonte de 16 días
      hoy,
      pronostico: [],
      promedioMensual: [climaMes(12, 0.7), climaMes(1, 0.2)],
    });
    expect(r[0].fuente).toBe('promedio');
    expect(r[0].lluvioso).toBe(true); // diciembre 0.7
    expect(r[1].lluvioso).toBe(false); // enero 0.2
  });

  it('sin pronóstico ni promedio trata el día como seco', () => {
    const r = clasificarDias({
      fechas: ['2026-12-03'],
      hoy,
      pronostico: [],
      promedioMensual: [],
    });
    expect(r[0].lluvioso).toBe(false);
    expect(r[0].probabilidadLluvia).toBe(0);
  });
});

describe('aClimaDia', () => {
  it('reduce el detalle a {fecha, lluvioso} para el generador', () => {
    const detalle = clasificarDias({
      fechas: ['2026-12-03'],
      hoy: '2026-12-01',
      pronostico: [pron({ fecha: '2026-12-03', probabilidadPct: 80 })],
      promedioMensual: [],
    });
    expect(aClimaDia(detalle)).toEqual([
      { fecha: '2026-12-03', lluvioso: true },
    ]);
  });
});
