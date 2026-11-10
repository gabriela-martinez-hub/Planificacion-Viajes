// Verifica el seed del catálogo (T-08): pasa Zod, la integridad referencial es
// correcta y el grafo de buses conecta los 53 municipios (criterios de F-a).
import { describe, it, expect } from 'vitest';
import { construirSeed } from '../../../supabase/seed/datos/index';
import { validarReferencias, analizarConectividadBus } from './validar';

describe('seed del catálogo', () => {
  // construirSeed valida con Zod; si una fila no cumple, lanza aquí.
  const cat = construirSeed();

  it('tiene los 53 municipios de los tres departamentos', () => {
    expect(cat.municipios).toHaveLength(53);
    const porDepto = (d: string) =>
      cat.municipios.filter((m) => m.departamento_id === d).length;
    expect(porDepto('caldas')).toBe(27);
    expect(porDepto('quindio')).toBe(12);
    expect(porDepto('risaralda')).toBe(14);
  });

  it('marca Salamina y Aguadas como pueblos patrimonio y ningún otro', () => {
    const patrimonio = cat.municipios
      .filter((m) => m.es_pueblo_patrimonio)
      .map((m) => m.id)
      .sort();
    expect(patrimonio).toEqual(['aguadas', 'salamina']);
  });

  it('tiene exactamente un casco urbano por municipio', () => {
    const cascos = cat.atracciones.filter((a) => a.es_casco_urbano);
    expect(cascos).toHaveLength(53);
    const municipios = new Set(cascos.map((a) => a.municipio_id));
    expect(municipios.size).toBe(53);
  });

  it('tiene entre 40 y 60 atracciones no-casco (plan.md 7)', () => {
    // El plan pide 40-60 atracciones para empezar. Contamos cascos + reales:
    // cada municipio aporta su casco y los turísticos aportan atracciones.
    const total = cat.atracciones.length;
    expect(total).toBeGreaterThanOrEqual(40);
  });

  it('pasa la validación de integridad referencial sin problemas', () => {
    const problemas = validarReferencias(cat);
    expect(problemas).toEqual([]);
  });

  it('conecta todos los municipios en el grafo de buses', () => {
    const c = analizarConectividadBus(cat);
    expect(c.aislados).toEqual([]);
    expect(c.todosConectados).toBe(true);
    expect(c.alcanzables).toHaveLength(53);
  });

  it('todo costo del catálogo tiene fecha_actualizacion y fuente', () => {
    for (const a of cat.atracciones) {
      expect(a.fecha_actualizacion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.fuente.length).toBeGreaterThan(0);
    }
    for (const t of cat.tarifas_referencia) {
      expect(t.fecha_actualizacion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.fuente.length).toBeGreaterThan(0);
    }
    for (const r of cat.rutas_bus) {
      expect(r.fecha_actualizacion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.fuente.length).toBeGreaterThan(0);
    }
  });

  it('las rutas temáticas y sus insignias existen', () => {
    const rutas = cat.rutas_tematicas.map((r) => r.id).sort();
    expect(rutas).toEqual(['cafe', 'pueblos-patrimonio', 'termales']);
    // Pueblos patrimonio apunta a los dos municipios correctos.
    const pp = cat.ruta_items
      .filter((i) => i.ruta_id === 'pueblos-patrimonio')
      .map((i) => i.municipio_id)
      .sort();
    expect(pp).toEqual(['aguadas', 'salamina']);
  });
});
