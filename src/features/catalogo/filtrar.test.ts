// Pruebas de la lógica de filtrado del catálogo (T-09). Usa el seed real para
// que los casos reflejen datos verdaderos.
import { describe, it, expect } from 'vitest';
import { construirSeed } from '../../../supabase/seed/datos/index';
import {
  atraccionesVisiblesPorMunicipio,
  atraccionesFiltradas,
  municipiosFiltrados,
  normalizar,
} from './filtrar';

const cat = construirSeed();
const sinFiltro = { busqueda: '', departamento: '', estilo: '' };

describe('normalizar', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizar('Chinchiná')).toBe('chinchina');
    expect(normalizar('QUINDÍO')).toBe('quindio');
  });
});

describe('atraccionesVisiblesPorMunicipio', () => {
  it('excluye los cascos urbanos', () => {
    const mapa = atraccionesVisiblesPorMunicipio(cat.atracciones, '');
    const todas = [...mapa.values()].flat();
    expect(todas.every((a) => !a.es_casco_urbano)).toBe(true);
    // Salento tiene atracciones reales (Cocora, Calle Real).
    expect((mapa.get('salento') ?? []).length).toBeGreaterThan(0);
  });

  it('filtra por estilo', () => {
    const mapa = atraccionesVisiblesPorMunicipio(cat.atracciones, 'descanso');
    const todas = [...mapa.values()].flat();
    expect(todas.length).toBeGreaterThan(0);
    expect(todas.every((a) => a.estilos.includes('descanso'))).toBe(true);
  });
});

describe('municipiosFiltrados', () => {
  it('sin filtros devuelve los 53 municipios', () => {
    const mapa = atraccionesVisiblesPorMunicipio(cat.atracciones, '');
    const r = municipiosFiltrados(cat.municipios, mapa, sinFiltro);
    expect(r).toHaveLength(53);
  });

  it('filtra por departamento', () => {
    const mapa = atraccionesVisiblesPorMunicipio(cat.atracciones, '');
    const r = municipiosFiltrados(cat.municipios, mapa, {
      ...sinFiltro,
      departamento: 'quindio',
    });
    expect(r).toHaveLength(12);
    expect(r.every((m) => m.departamento_id === 'quindio')).toBe(true);
  });

  it('busca por nombre de municipio sin importar tildes', () => {
    const mapa = atraccionesVisiblesPorMunicipio(cat.atracciones, '');
    const r = municipiosFiltrados(cat.municipios, mapa, {
      ...sinFiltro,
      busqueda: 'chinchina',
    });
    expect(r.map((m) => m.id)).toContain('chinchina');
  });

  it('busca por nombre de atracción y devuelve su municipio', () => {
    const mapa = atraccionesVisiblesPorMunicipio(cat.atracciones, '');
    const r = municipiosFiltrados(cat.municipios, mapa, {
      ...sinFiltro,
      busqueda: 'cocora',
    });
    expect(r.map((m) => m.id)).toContain('salento');
  });

  it('con filtro de estilo solo deja municipios con esa clase de atracción', () => {
    const mapa = atraccionesVisiblesPorMunicipio(cat.atracciones, 'descanso');
    const r = municipiosFiltrados(cat.municipios, mapa, {
      ...sinFiltro,
      estilo: 'descanso',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((m) => (mapa.get(m.id)?.length ?? 0) > 0)).toBe(true);
    // Santa Rosa de Cabal tiene termales (descanso).
    expect(r.map((m) => m.id)).toContain('santa-rosa-de-cabal');
  });
});

describe('atraccionesFiltradas', () => {
  it('excluye cascos urbanos y lista atracciones reales', () => {
    const r = atraccionesFiltradas(cat.atracciones, cat.municipios, sinFiltro);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((a) => !a.es_casco_urbano)).toBe(true);
  });

  it('filtra por departamento según el municipio de la atracción', () => {
    const r = atraccionesFiltradas(cat.atracciones, cat.municipios, {
      ...sinFiltro,
      departamento: 'quindio',
    });
    const municipiosQuindio = new Set(
      cat.municipios
        .filter((m) => m.departamento_id === 'quindio')
        .map((m) => m.id),
    );
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((a) => municipiosQuindio.has(a.municipio_id))).toBe(true);
  });

  it('busca por nombre de atracción sin importar tildes', () => {
    const r = atraccionesFiltradas(cat.atracciones, cat.municipios, {
      ...sinFiltro,
      busqueda: 'cocora',
    });
    expect(r.map((a) => a.id)).toContain('valle-de-cocora');
  });

  it('devuelve vacío cuando no hay coincidencia', () => {
    const r = atraccionesFiltradas(cat.atracciones, cat.municipios, {
      ...sinFiltro,
      busqueda: 'xyzinexistente',
    });
    expect(r).toEqual([]);
  });
});
