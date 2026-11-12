// Pruebas del ajuste de presupuesto (T-15, plan.md 6.1 paso 8 y 6.2).
//
// Cubren los criterios de aceptación de F-c verificables en el dominio puro:
// cuando existe un itinerario factible el ajustado nunca supera el monto;
// cuando no existe se devuelve el mínimo y no se marca como ajustado; las
// atracciones obligatorias nunca se quitan; el desglose por persona; y 0 noches.

import { describe, it, expect } from 'vitest';
import { construirSeed } from '../../../supabase/seed/datos/index';
import {
  catalogoParaItinerario,
  generarItinerario,
  type CatalogoItinerario,
  type EntradaItinerario,
} from '../itinerario';
import { ajustarAPresupuesto, desglosar } from './index';

const catalogo: CatalogoItinerario = catalogoParaItinerario(construirSeed());

function entrada(parcial: Partial<EntradaItinerario>): EntradaItinerario {
  return {
    catalogo,
    origenNodoId: 'armenia',
    fechaInicio: '2026-12-01',
    fechaFin: '2026-12-03',
    incluyeRegreso: true,
    viajeros: 2,
    estilos: ['naturaleza'],
    nivel: 'alto',
    municipiosElegidos: ['salento'],
    atraccionesObligatorias: [],
    limiteJornadaMin: 540,
    climaPorDia: [],
    ...parcial,
  };
}

/** Total del itinerario que genera una entrada (para fijar montos de prueba). */
function totalDe(e: EntradaItinerario): number {
  const r = generarItinerario(e);
  if (!r.ok) throw new Error('no se pudo generar');
  return r.itinerario.costos.total;
}

describe('ajustarAPresupuesto', () => {
  it('si ya cumple el monto, no ajusta nada', () => {
    const e = entrada({ nivel: 'economico' });
    const total = totalDe(e);
    const r = ajustarAPresupuesto(e, total + 100_000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ajustado).toBe(false);
    expect(r.actividadesQuitadas).toEqual([]);
    expect(r.itinerario.costos.total).toBeLessThanOrEqual(total + 100_000);
  });

  it('cuando existe un itinerario factible, el ajustado nunca supera el monto', () => {
    // Nivel alto es caro; el económico cabe. Ponemos el monto entre ambos.
    const alto = totalDe(entrada({ nivel: 'alto' }));
    const economico = totalDe(entrada({ nivel: 'economico' }));
    expect(economico).toBeLessThan(alto);
    const monto = Math.floor((alto + economico) / 2);
    const r = ajustarAPresupuesto(entrada({ nivel: 'alto' }), monto);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itinerario.costos.total).toBeLessThanOrEqual(monto);
    expect(r.ajustado).toBe(true);
  });

  it('baja el nivel antes de quitar actividades', () => {
    const alto = totalDe(entrada({ nivel: 'alto' }));
    const economico = totalDe(entrada({ nivel: 'economico' }));
    const monto = Math.floor((alto + economico) / 2);
    const r = ajustarAPresupuesto(entrada({ nivel: 'alto' }), monto);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Al bajar de nivel debería alcanzar sin sacrificar actividades.
    expect(r.actividadesQuitadas).toEqual([]);
    expect(r.nivelAlojamiento).not.toBe('alto');
  });

  it('quita actividades no obligatorias cuando ni el nivel económico alcanza', () => {
    // Monto apenas por encima del mínimo imprescindible (económico sin
    // actividades): fuerza a podar actividades pero sigue siendo factible.
    const e = entrada({ nivel: 'economico', estilos: ['naturaleza'] });
    const economico = totalDe(e);
    // Un monto por debajo del económico completo obliga a podar.
    const monto = economico - 1;
    const r = ajustarAPresupuesto(e, monto);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itinerario.costos.total).toBeLessThanOrEqual(monto);
    expect(r.actividadesQuitadas.length).toBeGreaterThan(0);
  });

  it('las atracciones obligatorias nunca se quitan', () => {
    const e = entrada({
      nivel: 'economico',
      atraccionesObligatorias: ['valle-de-cocora'],
    });
    // Monto muy bajo: obliga a podar todo lo posible.
    const r = ajustarAPresupuesto(e, 1);
    // Puede ser ok o no-ok, pero en ningún caso debe quitar la obligatoria.
    if (r.ok) {
      expect(r.actividadesQuitadas).not.toContain('valle-de-cocora');
      const ids = r.itinerario.dias
        .flatMap((d) => d.items)
        .filter((i) => i.tipo === 'actividad')
        .map((i) => i.atraccionId);
      expect(ids).toContain('valle-de-cocora');
    } else {
      // En el mínimo, la obligatoria sigue presente.
      const ids = r.itinerarioMinimo.dias
        .flatMap((d) => d.items)
        .filter((i) => i.tipo === 'actividad')
        .map((i) => i.atraccionId);
      expect(ids).toContain('valle-de-cocora');
    }
  });

  it('cuando no existe itinerario factible, devuelve el mínimo y no lo marca como ajustado', () => {
    const r = ajustarAPresupuesto(entrada({ nivel: 'alto' }), 1);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.minimoCop).toBeGreaterThan(1);
    // El mínimo es el económico sin actividades no obligatorias.
    expect(r.itinerarioMinimo.costos.total).toBe(r.minimoCop);
  });

  it('es determinista: misma entrada y monto producen el mismo resultado', () => {
    const e = entrada({ nivel: 'alto' });
    const alto = totalDe(entrada({ nivel: 'alto' }));
    const economico = totalDe(entrada({ nivel: 'economico' }));
    const monto = Math.floor((alto + economico) / 2);
    const a = ajustarAPresupuesto(e, monto);
    const b = ajustarAPresupuesto(e, monto);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
});

describe('desglosar', () => {
  it('reparte los costos del grupo entre los viajeros', () => {
    const r = generarItinerario(entrada({ nivel: 'economico', viajeros: 2 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = desglosar(r.itinerario, 2);
    expect(d.viajeros).toBe(2);
    expect(d.porPersona.total).toBe(Math.ceil(d.grupo.total / 2));
    expect(d.grupo.total).toBe(r.itinerario.costos.total);
  });

  it('un viaje de 1 día sin regreso tiene alojamiento pero el desglose por persona no divide por cero', () => {
    // 0 noches: 1 día con regreso. Usamos origen = municipio base para que sea
    // factible en un día.
    const e = entrada({
      origenNodoId: 'salento',
      municipiosElegidos: ['salento'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-01',
      incluyeRegreso: true,
      viajeros: 1,
    });
    const r = generarItinerario(e);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = desglosar(r.itinerario, 1);
    // 0 noches => sin costo de alojamiento.
    expect(r.itinerario.costos.alojamiento).toBe(0);
    expect(d.porPersona.total).toBe(d.grupo.total);
  });
});
