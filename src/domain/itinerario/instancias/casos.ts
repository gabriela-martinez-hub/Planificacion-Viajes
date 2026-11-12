// Banco de instancias de evaluación del generador (plan.md 6.0, T-27).
//
// 24 instancias versionadas que cubren tamaños y situaciones distintas: viajes
// de 1 a 6 días, uno o varios municipios, estilos variados, días de cierre,
// clima lluvioso, atracciones obligatorias, acceso restringido/cerrado, origen
// externo con traslado largo y casos infactibles. Las marcadas `aptaFuerzaBruta`
// tienen ≤ 8 atracciones candidatas y se comparan contra el óptimo exacto.
//
// La mayoría son catálogos sintéticos y controlados (fabrica.ts) para que el
// óptimo por fuerza bruta sea significativo. Las últimas usan el seed real para
// comprobar el comportamiento a escala del catálogo de producción.

import { construirSeed } from '../../../../supabase/seed/datos/index';
import { catalogoParaItinerario } from '../index';
import {
  atraccion,
  catalogoDe,
  corredor,
  municipio,
  origenExterno,
} from './fabrica';
import type { EntradaItinerario } from '../tipos';

export interface Instancia {
  nombre: string;
  descripcion: string;
  entrada: EntradaItinerario;
  /** true si es lo bastante pequeña para la fuerza bruta (≤ 8 candidatas). */
  aptaFuerzaBruta: boolean;
  /** true si se espera que el generador falle (caso infactible). */
  esperaFallo?: boolean;
}

const catalogoSeed = catalogoParaItinerario(construirSeed());

/** Base de una entrada; cada instancia sobreescribe lo necesario. */
function entradaBase(parcial: Partial<EntradaItinerario>): EntradaItinerario {
  return {
    catalogo: catalogoSeed,
    origenNodoId: 'armenia',
    fechaInicio: '2026-12-01',
    fechaFin: '2026-12-02',
    incluyeRegreso: false,
    viajeros: 2,
    estilos: [],
    nivel: 'economico',
    municipiosElegidos: ['salento'],
    atraccionesObligatorias: [],
    limiteJornadaMin: 540,
    climaPorDia: [],
    ...parcial,
  };
}

// ------------------------------------------------------------ catálogos sintéticos

// Un solo municipio con 4 atracciones de estilos variados. Origen = municipio.
const unMunicipio = catalogoDe({
  municipios: [municipio('pueblo-a')],
  atracciones: [
    atraccion('a-aventura', 'pueblo-a', {
      estilos: ['aventura'],
      duracion_min: 180,
      al_aire_libre: true,
    }),
    atraccion('a-cultura', 'pueblo-a', {
      estilos: ['cultura_cafetera'],
      duracion_min: 120,
    }),
    atraccion('a-descanso', 'pueblo-a', {
      estilos: ['descanso'],
      duracion_min: 90,
    }),
    atraccion('a-casco', 'pueblo-a', {
      es_casco_urbano: true,
      duracion_min: 60,
    }),
  ],
  rutasBus: [],
});

// Dos municipios conectados, origen externo con traslado corto.
const dosMunicipios = catalogoDe({
  municipios: [municipio('pueblo-a'), municipio('pueblo-b')],
  origenesExternos: [origenExterno('ciudad-x')],
  atracciones: [
    atraccion('a1', 'pueblo-a', { estilos: ['naturaleza'], duracion_min: 150 }),
    atraccion('a2', 'pueblo-a', { estilos: ['aventura'], duracion_min: 120 }),
    atraccion('b1', 'pueblo-b', {
      estilos: ['cultura_cafetera'],
      duracion_min: 180,
    }),
    atraccion('b2', 'pueblo-b', { estilos: ['descanso'], duracion_min: 90 }),
  ],
  rutasBus: [
    ...corredor('ciudad-x', 'pueblo-a', 120, 20000),
    ...corredor('pueblo-a', 'pueblo-b', 40, 6000),
  ],
});

// Municipio con una atracción muy larga (satura la jornada) y otras.
const jornadaApretada = catalogoDe({
  municipios: [municipio('pueblo-c')],
  atracciones: [
    atraccion('c-larga', 'pueblo-c', {
      estilos: ['aventura'],
      duracion_min: 450,
      al_aire_libre: true,
    }),
    atraccion('c-media', 'pueblo-c', {
      estilos: ['naturaleza'],
      duracion_min: 240,
      al_aire_libre: true,
    }),
    atraccion('c-corta', 'pueblo-c', {
      estilos: ['cultura_cafetera'],
      duracion_min: 120,
    }),
  ],
  rutasBus: [],
});

// Días de cierre: una atracción cierra lunes y martes.
const conCierres = catalogoDe({
  municipios: [municipio('pueblo-d')],
  atracciones: [
    atraccion('d-finde', 'pueblo-d', {
      estilos: ['cultura_cafetera'],
      duracion_min: 180,
      dias_cerrado: [1, 2], // lunes y martes
    }),
    atraccion('d-siempre', 'pueblo-d', {
      estilos: ['descanso'],
      duracion_min: 120,
    }),
  ],
  rutasBus: [],
});

// Acceso restringido y cerrado.
const conAcceso = catalogoDe({
  municipios: [municipio('pueblo-e')],
  atracciones: [
    atraccion('e-abierta', 'pueblo-e', {
      estilos: ['naturaleza'],
      duracion_min: 120,
      al_aire_libre: true,
    }),
    atraccion('e-restringida', 'pueblo-e', {
      estilos: ['aventura'],
      duracion_min: 150,
      estado_acceso: 'restringida',
      requiere_guia: true,
    }),
    atraccion('e-cerrada', 'pueblo-e', {
      estilos: ['aventura'],
      duracion_min: 150,
      estado_acceso: 'cerrada',
    }),
  ],
  rutasBus: [],
});

// ------------------------------------------------------------ banco de instancias

export const INSTANCIAS: Instancia[] = [
  // --- sintéticas pequeñas (aptas para fuerza bruta) ---
  {
    nombre: 'sint-01-un-dia-un-municipio',
    descripcion: 'Un día, un municipio, sin estilos preferidos',
    entrada: entradaBase({
      catalogo: unMunicipio,
      origenNodoId: 'pueblo-a',
      municipiosElegidos: ['pueblo-a'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-02',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-02-un-dia-estilo-aventura',
    descripcion: 'Un día priorizando aventura',
    entrada: entradaBase({
      catalogo: unMunicipio,
      origenNodoId: 'pueblo-a',
      municipiosElegidos: ['pueblo-a'],
      estilos: ['aventura'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-02',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-03-dos-dias-un-municipio',
    descripcion: 'Dos días en un municipio: reparte las 3 atracciones',
    entrada: entradaBase({
      catalogo: unMunicipio,
      origenNodoId: 'pueblo-a',
      municipiosElegidos: ['pueblo-a'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-03',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-04-dos-municipios-origen-externo',
    descripcion: 'Dos municipios, origen externo, 3 días con regreso',
    entrada: entradaBase({
      catalogo: dosMunicipios,
      origenNodoId: 'ciudad-x',
      municipiosElegidos: ['pueblo-a', 'pueblo-b'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-03',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-05-jornada-apretada',
    descripcion: 'Atracción de 450 min: no todo cabe en un día',
    entrada: entradaBase({
      catalogo: jornadaApretada,
      origenNodoId: 'pueblo-c',
      municipiosElegidos: ['pueblo-c'],
      estilos: ['aventura', 'naturaleza'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-02',
      limiteJornadaMin: 540,
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-06-jornada-apretada-dos-dias',
    descripcion: 'Dos días para repartir atracciones largas',
    entrada: entradaBase({
      catalogo: jornadaApretada,
      origenNodoId: 'pueblo-c',
      municipiosElegidos: ['pueblo-c'],
      estilos: ['aventura', 'naturaleza'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-03',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-07-cierre-lunes',
    descripcion: 'Un lunes: la atracción que cierra lunes no entra',
    entrada: entradaBase({
      catalogo: conCierres,
      origenNodoId: 'pueblo-d',
      municipiosElegidos: ['pueblo-d'],
      fechaInicio: '2026-12-07', // lunes
      fechaFin: '2026-12-07',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-08-cierre-no-aplica-sabado',
    descripcion: 'Un sábado: ambas atracciones pueden entrar',
    entrada: entradaBase({
      catalogo: conCierres,
      origenNodoId: 'pueblo-d',
      municipiosElegidos: ['pueblo-d'],
      fechaInicio: '2026-12-05', // sábado
      fechaFin: '2026-12-05',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-09-acceso-cerrado-excluido',
    descripcion: 'La atracción cerrada no debe entrar si no es obligatoria',
    entrada: entradaBase({
      catalogo: conAcceso,
      origenNodoId: 'pueblo-e',
      municipiosElegidos: ['pueblo-e'],
      estilos: ['aventura', 'naturaleza'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-03',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-10-obligatoria',
    descripcion: 'Fuerza una atracción concreta como obligatoria',
    entrada: entradaBase({
      catalogo: dosMunicipios,
      origenNodoId: 'ciudad-x',
      municipiosElegidos: ['pueblo-a', 'pueblo-b'],
      atraccionesObligatorias: ['b2'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-03',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-11-lluvia-un-dia',
    descripcion: 'Día lluvioso con atracciones al aire libre (penalización)',
    entrada: entradaBase({
      catalogo: jornadaApretada,
      origenNodoId: 'pueblo-c',
      municipiosElegidos: ['pueblo-c'],
      estilos: ['aventura', 'naturaleza'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-03',
      climaPorDia: [
        { fecha: '2026-12-02', lluvioso: true },
        { fecha: '2026-12-03', lluvioso: false },
      ],
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-12-origen-igual-destino',
    descripcion: 'Origen = municipio base, sin traslado de llegada',
    entrada: entradaBase({
      catalogo: unMunicipio,
      origenNodoId: 'pueblo-a',
      municipiosElegidos: ['pueblo-a'],
      estilos: ['descanso'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-04',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-13-restringida-permitida',
    descripcion: 'La restringida sí puede entrar (solo la cerrada se excluye)',
    entrada: entradaBase({
      catalogo: conAcceso,
      origenNodoId: 'pueblo-e',
      municipiosElegidos: ['pueblo-e'],
      estilos: ['aventura'],
      fechaInicio: '2026-12-02',
      fechaFin: '2026-12-02',
    }),
    aptaFuerzaBruta: true,
  },
  {
    nombre: 'sint-14-regreso-largo',
    descripcion: 'Regreso a ciudad externa; el último día es de solo traslado',
    entrada: entradaBase({
      catalogo: dosMunicipios,
      origenNodoId: 'ciudad-x',
      municipiosElegidos: ['pueblo-a'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-03',
      incluyeRegreso: true,
      limiteJornadaMin: 90, // fuerza que el traslado de 120 min sea solo-traslado
    }),
    aptaFuerzaBruta: true,
  },

  // --- casos infactibles (deben fallar con un motivo tipado) ---
  {
    nombre: 'sint-15-infactible-un-dia-externo-regreso',
    descripcion: 'Un día desde ciudad externa con regreso: infactible',
    entrada: entradaBase({
      catalogo: dosMunicipios,
      origenNodoId: 'ciudad-x',
      municipiosElegidos: ['pueblo-a'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-01',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: false,
    esperaFallo: true,
  },
  {
    nombre: 'sint-16-infactible-sin-municipios',
    descripcion: 'Sin municipios elegidos: falla',
    entrada: entradaBase({
      catalogo: unMunicipio,
      origenNodoId: 'pueblo-a',
      municipiosElegidos: [],
    }),
    aptaFuerzaBruta: false,
    esperaFallo: true,
  },

  // --- seed real (escala de producción, no aptas para fuerza bruta) ---
  {
    nombre: 'seed-17-salento-naturaleza',
    descripcion: 'Seed real: Salento, 3 días, naturaleza, con regreso',
    entrada: entradaBase({
      origenNodoId: 'armenia',
      municipiosElegidos: ['salento'],
      estilos: ['naturaleza'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-03',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: false,
  },
  {
    nombre: 'seed-18-eje-cafetero-cultura',
    descripcion: 'Seed real: varios municipios del Quindío, cultura cafetera',
    entrada: entradaBase({
      origenNodoId: 'armenia',
      municipiosElegidos: ['salento', 'filandia', 'montenegro'],
      estilos: ['cultura_cafetera'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-04',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: false,
  },
  {
    nombre: 'seed-19-manizales-aventura',
    descripcion: 'Seed real: Manizales y alrededores, aventura',
    entrada: entradaBase({
      origenNodoId: 'manizales',
      municipiosElegidos: ['manizales', 'villamaria'],
      estilos: ['aventura', 'naturaleza'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-03',
      incluyeRegreso: false,
    }),
    aptaFuerzaBruta: false,
  },
  {
    nombre: 'seed-20-pereira-descanso',
    descripcion: 'Seed real: Pereira y Santa Rosa, descanso',
    entrada: entradaBase({
      origenNodoId: 'pereira',
      municipiosElegidos: ['pereira', 'santa-rosa-de-cabal'],
      estilos: ['descanso'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-03',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: false,
  },
  {
    nombre: 'seed-21-bogota-traslado-largo',
    descripcion: 'Seed real: origen Bogotá (traslado largo), 4 días',
    entrada: entradaBase({
      origenNodoId: 'bogota',
      municipiosElegidos: ['armenia'],
      estilos: ['cultura_cafetera'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-04',
      incluyeRegreso: false,
      limiteJornadaMin: 300,
    }),
    aptaFuerzaBruta: false,
  },
  {
    nombre: 'seed-22-lluvia-reorganiza',
    descripcion:
      'Seed real: con días lluviosos para ejercitar la búsqueda local',
    entrada: entradaBase({
      origenNodoId: 'armenia',
      municipiosElegidos: ['salento'],
      estilos: ['naturaleza', 'aventura'],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-04',
      incluyeRegreso: true,
      climaPorDia: [
        { fecha: '2026-12-01', lluvioso: true },
        { fecha: '2026-12-02', lluvioso: false },
        { fecha: '2026-12-03', lluvioso: true },
        { fecha: '2026-12-04', lluvioso: false },
      ],
    }),
    aptaFuerzaBruta: false,
  },
  {
    nombre: 'seed-23-nivel-alto',
    descripcion: 'Seed real: mismo viaje a nivel alto (costos mayores)',
    entrada: entradaBase({
      origenNodoId: 'armenia',
      municipiosElegidos: ['salento', 'filandia'],
      estilos: ['gastronomia'],
      nivel: 'alto',
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-03',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: false,
  },
  {
    nombre: 'seed-24-seis-dias-varios',
    descripcion: 'Seed real: 6 días, cuatro municipios, todos los estilos',
    entrada: entradaBase({
      origenNodoId: 'armenia',
      municipiosElegidos: ['salento', 'filandia', 'montenegro', 'calarca'],
      estilos: [
        'naturaleza',
        'aventura',
        'cultura_cafetera',
        'descanso',
        'gastronomia',
      ],
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-06',
      incluyeRegreso: true,
    }),
    aptaFuerzaBruta: false,
  },
];
