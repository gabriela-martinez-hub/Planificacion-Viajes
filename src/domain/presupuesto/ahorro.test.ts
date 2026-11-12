// Pruebas del modo soñado: meta de ahorro y cuota (T-16, plan.md 6.2).
//
// Cubren el criterio de F-c: la cuota se recalcula al registrar aportes y no es
// negativa ni divide por cero; más meta vencida y meta cumplida.

import { describe, it, expect } from 'vitest';
import {
  calcularAhorro,
  totalAportado,
  type Aporte,
  type EntradaAhorro,
} from './ahorro';

function entrada(parcial: Partial<EntradaAhorro>): EntradaAhorro {
  return {
    metaCop: 1_000_000,
    frecuencia: 'mensual',
    fechaInicio: '2027-05-01',
    hoy: '2026-11-01',
    aportes: [],
    ...parcial,
  };
}

describe('totalAportado', () => {
  it('suma los aportes e ignora montos no positivos', () => {
    const aportes: Aporte[] = [
      { fecha: '2026-11-01', montoCop: 100_000 },
      { fecha: '2026-12-01', montoCop: 50_000 },
      { fecha: '2026-12-02', montoCop: -10 },
    ];
    expect(totalAportado(aportes)).toBe(150_000);
  });
});

describe('calcularAhorro', () => {
  it('calcula la cuota mensual sobre los meses completos que faltan', () => {
    // De 2026-11-01 a 2027-05-01 hay 6 meses completos.
    const r = calcularAhorro(entrada({ frecuencia: 'mensual' }));
    expect(r.estado).toBe('activa');
    expect(r.periodos).toBe(6);
    expect(r.cuota).toBe(Math.ceil(1_000_000 / 6));
  });

  it('la cuota baja al registrar aportes (se recalcula sobre el restante)', () => {
    const sin = calcularAhorro(entrada({}));
    const con = calcularAhorro(
      entrada({ aportes: [{ fecha: '2026-11-02', montoCop: 400_000 }] }),
    );
    expect(con.ahorrado).toBe(400_000);
    expect(con.restante).toBe(600_000);
    expect(con.cuota).toBe(Math.ceil(600_000 / 6));
    expect(con.cuota).toBeLessThan(sin.cuota);
  });

  it('la cuota nunca es negativa', () => {
    const r = calcularAhorro(
      entrada({ aportes: [{ fecha: '2026-11-02', montoCop: 2_000_000 }] }),
    );
    // Con más ahorro que la meta, la meta está cumplida y la cuota es 0.
    expect(r.cuota).toBe(0);
    expect(r.cuota).toBeGreaterThanOrEqual(0);
  });

  it('no divide por cero cuando falta menos de un periodo completo', () => {
    // De 2026-11-01 a 2026-11-15 hay 0 meses completos: usa max(1, periodos).
    const r = calcularAhorro(
      entrada({ fechaInicio: '2026-11-15', frecuencia: 'mensual' }),
    );
    expect(r.estado).toBe('activa');
    expect(r.periodos).toBe(0);
    expect(Number.isFinite(r.cuota)).toBe(true);
    expect(r.cuota).toBe(1_000_000); // toda la meta en una sola cuota
  });

  it('meta cumplida cuando el ahorro alcanza o supera la meta', () => {
    const r = calcularAhorro(
      entrada({ aportes: [{ fecha: '2026-11-02', montoCop: 1_000_000 }] }),
    );
    expect(r.estado).toBe('cumplida');
    expect(r.restante).toBe(0);
    expect(r.cuota).toBe(0);
    expect(r.progreso).toBe(1);
  });

  it('meta vencida cuando la fecha del viaje ya pasó', () => {
    const r = calcularAhorro(
      entrada({ fechaInicio: '2026-10-01', hoy: '2026-11-01' }),
    );
    expect(r.estado).toBe('vencida');
    expect(r.cuota).toBe(0);
  });

  it('meta vencida cuando la fecha del viaje es hoy', () => {
    const r = calcularAhorro(
      entrada({ fechaInicio: '2026-11-01', hoy: '2026-11-01' }),
    );
    expect(r.estado).toBe('vencida');
  });

  it('calcula la cuota semanal sobre las semanas completas', () => {
    // De 2026-11-01 a 2026-11-29 hay 28 días = 4 semanas completas.
    const r = calcularAhorro(
      entrada({ fechaInicio: '2026-11-29', frecuencia: 'semanal' }),
    );
    expect(r.periodos).toBe(4);
    expect(r.cuota).toBe(Math.ceil(1_000_000 / 4));
  });

  it('el progreso se acota a 1 y refleja la fracción ahorrada', () => {
    const r = calcularAhorro(
      entrada({ aportes: [{ fecha: '2026-11-02', montoCop: 250_000 }] }),
    );
    expect(r.progreso).toBeCloseTo(0.25, 5);
  });
});
