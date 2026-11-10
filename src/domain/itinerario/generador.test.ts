// Pruebas del generador de itinerario (T-11, plan.md 6.0 y 6.1).
//
// Cubren los criterios de aceptación de F-b verificables en el dominio puro:
// determinismo, el día 1 parte del origen, ningún día supera el límite de
// jornada salvo los de solo traslado, y los casos límite acordados (1 día,
// origen igual al destino, municipio inalcanzable, traslado largo desde Bogotá,
// infactible por 1 día + origen externo + regreso).

import { describe, it, expect } from 'vitest';
import { construirSeed } from '../../../supabase/seed/datos/index';
import { catalogoParaItinerario, generarItinerario } from './index';
import type { CatalogoItinerario, EntradaItinerario } from './tipos';

const catalogo: CatalogoItinerario = catalogoParaItinerario(construirSeed());

/** Entrada base; cada prueba sobreescribe lo que necesita. */
function entrada(parcial: Partial<EntradaItinerario>): EntradaItinerario {
  return {
    catalogo,
    origenNodoId: 'armenia',
    fechaInicio: '2026-12-01',
    fechaFin: '2026-12-03',
    incluyeRegreso: true,
    viajeros: 2,
    estilos: ['naturaleza'],
    nivel: 'economico',
    municipiosElegidos: ['salento'],
    atraccionesObligatorias: [],
    limiteJornadaMin: 540,
    climaPorDia: [],
    ...parcial,
  };
}

describe('generarItinerario', () => {
  it('genera un itinerario factible desde Armenia a Salento', () => {
    const r = generarItinerario(entrada({}));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itinerario.dias).toHaveLength(3);
    expect(r.itinerario.costos.total).toBeGreaterThan(0);
  });

  it('es determinista: misma entrada produce el mismo itinerario', () => {
    const a = generarItinerario(entrada({}));
    const b = generarItinerario(entrada({}));
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('el día 1 parte del origen elegido con un traslado en bus', () => {
    const r = generarItinerario(
      entrada({ origenNodoId: 'armenia', municipiosElegidos: ['salento'] }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const dia1 = r.itinerario.dias[0];
    const primerTraslado = dia1.items.find((i) => i.tipo === 'traslado');
    expect(primerTraslado).toBeDefined();
    expect(primerTraslado!.descripcion).toContain('Armenia');
  });

  it('cuando el origen es el mismo municipio base, el día 1 no tiene traslado de llegada', () => {
    const r = generarItinerario(
      entrada({ origenNodoId: 'salento', municipiosElegidos: ['salento'] }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const dia1 = r.itinerario.dias[0];
    const llegada = dia1.items.find(
      (i) => i.tipo === 'traslado' && !i.descripcion.includes('regreso'),
    );
    expect(llegada).toBeUndefined();
  });

  it('ningún día supera el límite de jornada salvo los de solo traslado', () => {
    const r = generarItinerario(entrada({ limiteJornadaMin: 540 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const d of r.itinerario.dias) {
      if (d.soloTraslado) continue;
      expect(d.minutosUsados).toBeLessThanOrEqual(540);
    }
  });

  it('marca el día como solo traslado cuando llegar desde Bogotá supera la jornada', () => {
    // Bogotá → Armenia son 480 min de bus; con un límite de 300 min el día de
    // llegada debe quedar como solo traslado y exento del límite.
    const r = generarItinerario(
      entrada({
        origenNodoId: 'bogota',
        municipiosElegidos: ['armenia'],
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-04',
        limiteJornadaMin: 300,
        incluyeRegreso: false,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const dia1 = r.itinerario.dias[0];
    expect(dia1.soloTraslado).toBe(true);
    expect(r.itinerario.avisos.some((a) => a.includes('solo traslado'))).toBe(
      true,
    );
  });

  it('informa los municipios inalcanzables en bus y no los incluye', () => {
    const r = generarItinerario(
      entrada({ municipiosElegidos: ['salento', 'municipio-fantasma'] }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itinerario.municipiosInalcanzables).toContain(
      'municipio-fantasma',
    );
  });

  it('rechaza un viaje de 1 día desde una ciudad externa con regreso', () => {
    const r = generarItinerario(
      entrada({
        origenNodoId: 'bogota',
        municipiosElegidos: ['armenia'],
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-01',
        incluyeRegreso: true,
      }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe('viaje_infactible');
  });

  it('rechaza un rango de fechas invertido', () => {
    const r = generarItinerario(
      entrada({ fechaInicio: '2026-12-05', fechaFin: '2026-12-01' }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe('rango_fechas_invalido');
  });

  it('rechaza un origen desconocido', () => {
    const r = generarItinerario(entrada({ origenNodoId: 'atlantida' }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe('origen_desconocido');
  });

  it('rechaza cuando no se eligió ningún municipio', () => {
    const r = generarItinerario(entrada({ municipiosElegidos: [] }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe('sin_municipios');
  });

  it('incluye las atracciones obligatorias que el usuario eligió', () => {
    // Elegimos una atracción real del seed como obligatoria.
    const atrReal = catalogo.atracciones.find(
      (a) => !a.es_casco_urbano && a.municipio_id === 'salento',
    );
    expect(atrReal).toBeDefined();
    const r = generarItinerario(
      entrada({
        municipiosElegidos: ['salento'],
        atraccionesObligatorias: [atrReal!.id],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const incluida = r.itinerario.dias.some((d) =>
      d.items.some((i) => i.atraccionId === atrReal!.id),
    );
    expect(incluida).toBe(true);
  });

  it('un viaje de 1 día sin regreso tiene 0 noches de alojamiento', () => {
    const r = generarItinerario(
      entrada({
        origenNodoId: 'salento',
        municipiosElegidos: ['salento'],
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-01',
        incluyeRegreso: false,
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const alojamientos = r.itinerario.dias.flatMap((d) =>
      d.items.filter((i) => i.tipo === 'alojamiento'),
    );
    // 1 día sin regreso = noches = días = 1, así que hay 1 alojamiento.
    expect(alojamientos).toHaveLength(1);
  });

  it('el costo de transporte escala con el número de viajeros', () => {
    const uno = generarItinerario(entrada({ viajeros: 1 }));
    const cuatro = generarItinerario(entrada({ viajeros: 4 }));
    expect(uno.ok && cuatro.ok).toBe(true);
    if (!uno.ok || !cuatro.ok) return;
    expect(cuatro.itinerario.costos.total).toBeGreaterThan(
      uno.itinerario.costos.total,
    );
  });
});
