// Pruebas de la validación del formulario del viaje (T-13).
import { describe, it, expect } from 'vitest';
import { formularioViajeSchema } from './esquemas';

function base(parcial: Record<string, unknown> = {}) {
  return {
    titulo: 'Mi viaje',
    origenNodoId: 'armenia',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-12',
    viajeros: 2,
    nivel: 'economico',
    municipiosElegidos: ['salento'],
    ...parcial,
  };
}

describe('formularioViajeSchema', () => {
  it('acepta un formulario válido', () => {
    expect(formularioViajeSchema.safeParse(base()).success).toBe(true);
  });

  it('rechaza la fecha de regreso anterior a la de ida', () => {
    const r = formularioViajeSchema.safeParse(
      base({ fechaInicio: '2026-12-12', fechaFin: '2026-12-10' }),
    );
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path.includes('fechaFin'))).toBe(true);
  });

  it('rechaza un viaje que empieza antes de hoy', () => {
    const r = formularioViajeSchema.safeParse(
      base({
        fechaInicio: '2020-01-01',
        fechaFin: '2020-01-05',
        hoy: '2026-11-10',
      }),
    );
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path.includes('fechaInicio'))).toBe(
      true,
    );
  });

  it('acepta un viaje que empieza hoy mismo', () => {
    const r = formularioViajeSchema.safeParse(
      base({
        fechaInicio: '2026-11-10',
        fechaFin: '2026-11-12',
        hoy: '2026-11-10',
      }),
    );
    expect(r.success).toBe(true);
  });

  it('exige al menos un municipio', () => {
    const r = formularioViajeSchema.safeParse(base({ municipiosElegidos: [] }));
    expect(r.success).toBe(false);
  });

  it('exige al menos un viajero', () => {
    const r = formularioViajeSchema.safeParse(base({ viajeros: 0 }));
    expect(r.success).toBe(false);
  });
});
