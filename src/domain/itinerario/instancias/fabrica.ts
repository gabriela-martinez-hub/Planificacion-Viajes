// Fábricas para construir mini-catálogos de prueba (T-27).
//
// Las instancias pequeñas (≤ 8 atracciones) usan catálogos sintéticos y
// controlados para poder comparar la heurística contra el óptimo por fuerza
// bruta. Estas fábricas crean objetos completos del tipo de salida del catálogo
// (Municipio, Atraccion, …) con valores por defecto sensatos, de modo que cada
// instancia solo declare lo que le importa (estilos, tiempos, días de cierre).

import type {
  Atraccion,
  Municipio,
  OrigenExterno,
  RutaBus,
  TarifaReferencia,
} from '../../catalogo/esquemas';
import type { CatalogoItinerario, Estilo } from '../tipos';

const FECHA = '2026-11-01';
const FUENTE = 'instancia-sintetica';

export function municipio(
  id: string,
  extra: Partial<Municipio> = {},
): Municipio {
  return {
    id,
    departamento_id: 'dep-test',
    codigo_dane: '00000',
    nombre: id,
    lat: 4.5,
    lon: -75.6,
    altitud_m: 1500,
    es_pueblo_patrimonio: false,
    radio_checkin_m: 1500,
    ...extra,
  };
}

export function origenExterno(
  id: string,
  extra: Partial<OrigenExterno> = {},
): OrigenExterno {
  return { id, nombre: id, lat: 4.6, lon: -74.1, ...extra };
}

export function atraccion(
  id: string,
  municipioId: string,
  extra: Partial<Atraccion> = {},
): Atraccion {
  return {
    id,
    municipio_id: municipioId,
    nombre: id,
    categoria: 'prueba',
    lat: 4.5,
    lon: -75.6,
    es_casco_urbano: false,
    costo_entrada_cop: 0,
    costo_aproximado: true,
    duracion_min: 120,
    minutos_desde_casco: 0,
    transporte_local_cop: 0,
    dias_cerrado: [],
    al_aire_libre: false,
    estilos: [],
    requiere_guia: false,
    estado_acceso: 'abierta',
    radio_checkin_m: 300,
    descripcion: '',
    fecha_actualizacion: FECHA,
    fuente: FUENTE,
    ...extra,
  };
}

export function rutaBus(
  origen: string,
  destino: string,
  minutos: number,
  tarifaCop: number,
): RutaBus {
  return {
    nodo_origen: origen,
    nodo_destino: destino,
    minutos,
    tarifa_cop: tarifaCop,
    costo_aproximado: true,
    fecha_actualizacion: FECHA,
    fuente: FUENTE,
  };
}

/** Par de rutas ida y vuelta entre dos nodos. */
export function corredor(
  a: string,
  b: string,
  minutos: number,
  tarifaCop: number,
): RutaBus[] {
  return [rutaBus(a, b, minutos, tarifaCop), rutaBus(b, a, minutos, tarifaCop)];
}

export function tarifasBasicas(): TarifaReferencia[] {
  const base = (
    concepto: 'alojamiento' | 'comida',
    nivel: 'economico' | 'medio' | 'alto',
    valor: number,
  ): TarifaReferencia => ({
    concepto,
    nivel,
    municipio_id: undefined,
    valor_cop: valor,
    unidad: concepto === 'alojamiento' ? 'persona_noche' : 'persona_dia',
    costo_aproximado: true,
    fecha_actualizacion: FECHA,
    fuente: FUENTE,
  });
  return [
    base('alojamiento', 'economico', 60000),
    base('alojamiento', 'medio', 120000),
    base('alojamiento', 'alto', 250000),
    base('comida', 'economico', 30000),
    base('comida', 'medio', 60000),
    base('comida', 'alto', 120000),
  ];
}

export interface PartesCatalogo {
  municipios: Municipio[];
  origenesExternos?: OrigenExterno[];
  atracciones: Atraccion[];
  rutasBus: RutaBus[];
  tarifas?: TarifaReferencia[];
}

/** Ensambla un CatalogoItinerario con tarifas básicas por defecto. */
export function catalogoDe(partes: PartesCatalogo): CatalogoItinerario {
  return {
    municipios: partes.municipios,
    origenesExternos: partes.origenesExternos ?? [],
    atracciones: partes.atracciones,
    rutasBus: partes.rutasBus,
    tarifas: partes.tarifas ?? tarifasBasicas(),
  };
}

export type { Estilo };
