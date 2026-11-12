// Pruebas del dominio de progreso (T-21, plan.md 6.4). Reflejan las reglas del
// trigger: visitado = algún check-in; verificada de conjunto = ceil(0.8*n)
// verificados.

import { describe, it, expect } from 'vitest';
import type {
  Departamento,
  Municipio,
  RutaTematica,
  RutaItem,
} from '../catalogo/esquemas';
import type { Checkin } from './esquemas';
import {
  visitaMunicipio,
  municipiosVisitados,
  progresoDepartamento,
  progresoEje,
  progresoRuta,
  progresoPorDepartamento,
  progresoPorRuta,
} from './progreso';

function checkin(
  parcial: Partial<Checkin> & { municipio_id: string },
): Checkin {
  return {
    id: crypto.randomUUID(),
    id_cliente: crypto.randomUUID(),
    usuario_id: '00000000-0000-0000-0000-000000000001',
    atraccion_id: null,
    recibido_en: '2026-11-12T00:00:00Z',
    verificado: false,
    distancia_m: null,
    precision_m: null,
    ...parcial,
  };
}

function muni(id: string, departamento_id: string): Municipio {
  return {
    id,
    departamento_id,
    codigo_dane: '00001',
    nombre: id,
    lat: 5,
    lon: -75,
    altitud_m: 1500,
    es_pueblo_patrimonio: false,
    radio_checkin_m: 1500,
  };
}

describe('visitaMunicipio', () => {
  it('no visitado sin check-ins', () => {
    expect(visitaMunicipio('armenia', [])).toEqual({
      visitado: false,
      verificado: false,
    });
  });

  it('visitado no verificado si el check-in es manual', () => {
    const cs = [checkin({ municipio_id: 'armenia', verificado: false })];
    expect(visitaMunicipio('armenia', cs)).toEqual({
      visitado: true,
      verificado: false,
    });
  });

  it('verificado si algún check-in del municipio está verificado', () => {
    const cs = [
      checkin({ municipio_id: 'armenia', verificado: false }),
      checkin({ municipio_id: 'armenia', verificado: true }),
    ];
    expect(visitaMunicipio('armenia', cs)).toEqual({
      visitado: true,
      verificado: true,
    });
  });
});

describe('municipiosVisitados', () => {
  it('devuelve el conjunto de municipio_id con check-in', () => {
    const cs = [
      checkin({ municipio_id: 'armenia' }),
      checkin({ municipio_id: 'salento' }),
      checkin({ municipio_id: 'armenia' }),
    ];
    expect(municipiosVisitados(cs)).toEqual(new Set(['armenia', 'salento']));
  });
});

describe('progresoDepartamento', () => {
  const municipios = [
    muni('armenia', 'quindio'),
    muni('salento', 'quindio'),
    muni('calarca', 'quindio'),
    muni('manizales', 'caldas'),
  ];

  it('cuenta solo los municipios del departamento', () => {
    const cs = [checkin({ municipio_id: 'armenia', verificado: true })];
    const p = progresoDepartamento('quindio', municipios, cs);
    expect(p.total).toBe(3);
    expect(p.visitados).toBe(1);
    expect(p.verificados).toBe(1);
    expect(p.completo).toBe(false);
  });

  it('completo cuando están todos; verificada con el 80 %', () => {
    // 3 municipios: ceil(0.8*3)=3 verificados para marcar verificada.
    const cs = [
      checkin({ municipio_id: 'armenia', verificado: true }),
      checkin({ municipio_id: 'salento', verificado: true }),
      checkin({ municipio_id: 'calarca', verificado: false }),
    ];
    const p = progresoDepartamento('quindio', municipios, cs);
    expect(p.completo).toBe(true);
    expect(p.verificados).toBe(2);
    expect(p.verificada).toBe(false); // 2 < 3
  });
});

describe('progresoEje', () => {
  it('usa todos los municipios dados', () => {
    const municipios = [
      muni('armenia', 'quindio'),
      muni('manizales', 'caldas'),
    ];
    const cs = [checkin({ municipio_id: 'armenia' })];
    const p = progresoEje(municipios, cs);
    expect(p.total).toBe(2);
    expect(p.visitados).toBe(1);
  });
});

describe('progresoRuta', () => {
  const items: RutaItem[] = [
    { ruta_id: 'cafe', atraccion_id: 'parque-del-cafe' },
    { ruta_id: 'cafe', atraccion_id: 'recinto' },
    { ruta_id: 'pueblos', municipio_id: 'salamina' },
  ];

  it('cuenta ítems por atracción', () => {
    const cs = [
      checkin({ municipio_id: 'montenegro', atraccion_id: 'parque-del-cafe' }),
    ];
    const p = progresoRuta('cafe', items, cs);
    expect(p.total).toBe(2);
    expect(p.visitados).toBe(1);
  });

  it('cuenta ítems por municipio', () => {
    const cs = [checkin({ municipio_id: 'salamina', verificado: true })];
    const p = progresoRuta('pueblos', items, cs);
    expect(p.total).toBe(1);
    expect(p.completo).toBe(true);
    expect(p.verificada).toBe(true); // ceil(0.8*1)=1 verificado
  });
});

describe('agregados', () => {
  it('progresoPorDepartamento devuelve uno por departamento', () => {
    const deps: Departamento[] = [
      { id: 'quindio', nombre: 'Quindío', codigo_dane: '63' },
      { id: 'caldas', nombre: 'Caldas', codigo_dane: '17' },
    ];
    const municipios = [
      muni('armenia', 'quindio'),
      muni('manizales', 'caldas'),
    ];
    const r = progresoPorDepartamento(deps, municipios, []);
    expect(r).toHaveLength(2);
    expect(r[0].departamento.id).toBe('quindio');
    expect(r[0].progreso.total).toBe(1);
  });

  it('progresoPorRuta devuelve uno por ruta', () => {
    const rutas: RutaTematica[] = [
      { id: 'cafe', clave_texto: 'rutas.cafe', fuente: 'x' },
    ];
    const items: RutaItem[] = [{ ruta_id: 'cafe', atraccion_id: 'a' }];
    const r = progresoPorRuta(rutas, items, []);
    expect(r).toHaveLength(1);
    expect(r[0].ruta.id).toBe('cafe');
    expect(r[0].progreso.total).toBe(1);
  });
});
