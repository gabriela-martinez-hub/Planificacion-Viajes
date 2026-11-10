// Tipos del generador de itinerario (plan.md 6.0 y 6.1).
//
// El dominio es puro: no lee red ni la hora del sistema. Recibe el catálogo, el
// clima por día (`ClimaDia[]`) y la fecha actual como parámetros. El clima real
// lo provee el servicio de T-17; aquí entra como dato de entrada.

import type {
  Atraccion,
  Municipio,
  OrigenExterno,
  RutaBus,
  TarifaReferencia,
  estilo as estiloEnum,
} from '../catalogo/esquemas';
import type { z } from 'zod';

export type Estilo = z.infer<typeof estiloEnum>;
export type Nivel = 'economico' | 'medio' | 'alto';

// ------------------------------------------------------------ catálogo de entrada

/**
 * Subconjunto del catálogo que necesita el generador. Se construye desde el
 * catálogo validado (misma forma que los esquemas Zod del dominio). Los
 * municipios y orígenes externos llevan su propio nombre y coordenadas, así que
 * no hace falta la tabla `nodos`.
 */
export interface CatalogoItinerario {
  municipios: Municipio[];
  origenesExternos: OrigenExterno[];
  atracciones: Atraccion[];
  rutasBus: RutaBus[];
  tarifas: TarifaReferencia[];
}

// ------------------------------------------------------------ clima

/** Clima de un día del viaje, indexado por la fecha 'AAAA-MM-DD'. */
export interface ClimaDia {
  fecha: string;
  /** true si el día se considera lluvioso (regla del servicio de clima). */
  lluvioso: boolean;
}

// ------------------------------------------------------------ entrada

/**
 * Parámetros de generación. `municipiosElegidos` son los municipios que el
 * usuario quiere visitar; `atraccionesObligatorias` las que exige incluir.
 */
export interface EntradaItinerario {
  catalogo: CatalogoItinerario;
  /** id del nodo de partida (municipio del catálogo u origen externo). */
  origenNodoId: string;
  /** Fechas en zona America/Bogota, 'AAAA-MM-DD'. */
  fechaInicio: string;
  fechaFin: string;
  /** Si true, el último día incluye el traslado de regreso al origen. */
  incluyeRegreso: boolean;
  viajeros: number;
  estilos: Estilo[];
  nivel: Nivel;
  municipiosElegidos: string[];
  atraccionesObligatorias: string[];
  /** Minutos máximos de jornada entre actividades y traslados (por defecto 540 = 9 h). */
  limiteJornadaMin: number;
  /** Clima por día del viaje. Puede faltar algún día (se trata como seco). */
  climaPorDia: ClimaDia[];
  /** Semilla fija para el desempate; el generador es determinista sin aleatoriedad. */
  pesoTraslado?: number; // λ de 6.0 (minutos de traslado). Por defecto 1.
  pesoLluvia?: number; // μ de 6.0 (penalización por lluvia). Por defecto 50.
}

// ------------------------------------------------------------ salida

export type TipoItem =
  'actividad' | 'traslado' | 'alojamiento' | 'comida' | 'libre';

/** Un ítem dentro de un día del itinerario. */
export interface ItemItinerario {
  orden: number;
  tipo: TipoItem;
  /** id de la atracción, si el ítem es una actividad. */
  atraccionId?: string;
  /** Texto descriptivo (nombre de la atracción, tramo de bus, etc.). */
  descripcion: string;
  /** Duración del ítem en minutos (incluye ida y vuelta desde el casco en actividades). */
  duracionMin: number;
  /** Costo estimado del ítem para todo el grupo, en COP. */
  costoCop: number;
  /** true si el usuario fijó el ítem; la regeneración y el clima lo respetan. */
  fijado: boolean;
}

/** Un día del itinerario, con su municipio base para dormir. */
export interface DiaItinerario {
  dia: number; // 1-indexado
  fecha: string;
  municipioBaseId: string;
  items: ItemItinerario[];
  /** Minutos usados en el día (actividades + traslados). */
  minutosUsados: number;
  /** true si es un día de solo traslado, exento del límite de jornada. */
  soloTraslado: boolean;
  /** true si el día está marcado como lluvioso. */
  lluvioso: boolean;
}

/** Costos del viaje agregados, en COP para todo el grupo. */
export interface DesgloseCostos {
  transporte: number;
  alojamiento: number;
  comida: number;
  entradas: number;
  actividades: number;
  total: number;
}

/** Itinerario generado con éxito. */
export interface Itinerario {
  dias: DiaItinerario[];
  costos: DesgloseCostos;
  /** Municipios elegidos que no tienen ruta de bus alcanzable desde el origen. */
  municipiosInalcanzables: string[];
  /** Avisos para mostrar al usuario (días de solo traslado, etc.). */
  avisos: string[];
}

/** Resultado del generador: éxito o fallo tipado (nunca lanza por datos de usuario). */
export type ResultadoItinerario =
  | { ok: true; itinerario: Itinerario }
  | { ok: false; motivo: MotivoFallo; mensaje: string };

export type MotivoFallo =
  | 'rango_fechas_invalido'
  | 'viaje_infactible'
  | 'origen_desconocido'
  | 'sin_municipios';
