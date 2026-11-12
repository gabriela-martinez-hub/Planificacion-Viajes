// Servicio de clima (T-17, plan.md 6.3).
//
// Obtiene el pronóstico diario de Open-Meteo y los promedios mensuales del seed
// (tabla clima_mensual de Supabase). Toda respuesta externa se valida con Zod;
// ante un fallo de red o de validación se devuelve un resultado tipado
// { ok: false, error } y la capa superior cae al promedio histórico (la regla
// de respaldo vive en el dominio, clasificarDias).
//
// No decide si un día es lluvioso: eso es del dominio (domain/clima). Aquí solo
// se traen y normalizan los datos crudos.

import { z } from 'zod';
import { supabase } from './supabase';
import {
  climaMensualSchema,
  type ClimaMensual,
} from '@/domain/catalogo/esquemas';
import type { PronosticoDia } from '@/domain/clima';

const BASE_OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const TIMEZONE = 'America/Bogota';
const FORECAST_DAYS = 16;
const VARIABLES_DIARIAS = [
  'precipitation_sum',
  'precipitation_probability_max',
  'temperature_2m_max',
  'temperature_2m_min',
] as const;

/** Resultado tipado: nunca lanza por red o validación (plan.md sección 4). */
export type ResultadoClima<T> =
  { ok: true; datos: T } | { ok: false; error: string };

/** Coordenadas de un lugar a consultar (municipio o atracción). */
export interface Lugar {
  /** Id del lugar (municipio o atracción), para mapear la respuesta. */
  id: string;
  lat: number;
  lon: number;
  /** Altitud opcional (plan.md 6.3: atracciones de montaña usan `elevation`). */
  altitudM?: number;
}

/** Pronóstico de un lugar: su id y la lista de días. */
export interface PronosticoLugar {
  id: string;
  dias: PronosticoDia[];
}

// ------------------------------------------------------------ esquema Zod

/** Bloque `daily` que devuelve Open-Meteo (arreglos paralelos por fecha). */
const dailySchema = z.object({
  time: z.array(z.string()),
  precipitation_sum: z.array(z.number().nullable()),
  precipitation_probability_max: z.array(z.number().nullable()),
  temperature_2m_max: z.array(z.number().nullable()),
  temperature_2m_min: z.array(z.number().nullable()),
});

/** Respuesta de un lugar. Open-Meteo añade metadatos que no nos interesan. */
const respuestaLugarSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  daily: dailySchema,
});

/**
 * La API devuelve un objeto si se pide un solo lugar y un arreglo si se piden
 * varios. Aceptamos ambas formas y las normalizamos a arreglo.
 */
const respuestaSchema = z.union([
  respuestaLugarSchema,
  z.array(respuestaLugarSchema),
]);

// ------------------------------------------------------------ pronóstico

/** Convierte el bloque `daily` (arreglos paralelos) en PronosticoDia[]. */
function aDias(daily: z.infer<typeof dailySchema>): PronosticoDia[] {
  return daily.time.map((fecha, i) => ({
    fecha,
    precipitacionMm: daily.precipitation_sum[i] ?? 0,
    probabilidadPct: daily.precipitation_probability_max[i] ?? 0,
    tempMin: daily.temperature_2m_min[i] ?? 0,
    tempMax: daily.temperature_2m_max[i] ?? 0,
  }));
}

/**
 * Pide el pronóstico de 16 días para uno o varios lugares en una sola llamada
 * (plan.md 6.3: lat/lon separados por comas). El orden de la respuesta coincide
 * con el de `lugares`, así que se re-asocia por índice.
 */
export async function obtenerPronostico(
  lugares: Lugar[],
  fetchFn: typeof fetch = fetch,
): Promise<ResultadoClima<PronosticoLugar[]>> {
  if (lugares.length === 0) return { ok: true, datos: [] };

  const params = new URLSearchParams({
    latitude: lugares.map((l) => l.lat).join(','),
    longitude: lugares.map((l) => l.lon).join(','),
    daily: VARIABLES_DIARIAS.join(','),
    timezone: TIMEZONE,
    forecast_days: String(FORECAST_DAYS),
  });
  // Altitud por lugar si la hay (afecta el modelo en terreno de montaña).
  if (lugares.some((l) => l.altitudM !== undefined)) {
    params.set(
      'elevation',
      lugares
        .map((l) => (l.altitudM !== undefined ? l.altitudM : 'nan'))
        .join(','),
    );
  }
  const url = `${BASE_OPEN_METEO}?${params.toString()}`;

  let respuestaCruda: unknown;
  try {
    const res = await fetchFn(url);
    if (!res.ok) {
      return { ok: false, error: `Open-Meteo respondió ${res.status}` };
    }
    respuestaCruda = await res.json();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error de red con Open-Meteo',
    };
  }

  const parseada = respuestaSchema.safeParse(respuestaCruda);
  if (!parseada.success) {
    return {
      ok: false,
      error: `Respuesta de Open-Meteo inesperada: ${parseada.error.message}`,
    };
  }

  const lista = Array.isArray(parseada.data) ? parseada.data : [parseada.data];
  if (lista.length !== lugares.length) {
    return {
      ok: false,
      error: `Open-Meteo devolvió ${lista.length} lugares; se esperaban ${lugares.length}`,
    };
  }

  const datos: PronosticoLugar[] = lista.map((r, i) => ({
    id: lugares[i].id,
    dias: aDias(r.daily),
  }));
  return { ok: true, datos };
}

// ------------------------------------------------------------ promedios del seed

/**
 * Lee los promedios mensuales de un municipio desde Supabase (clima_mensual).
 * Devuelve las filas (idealmente 12). Si la tabla está vacía (hasta T-25),
 * devuelve un arreglo vacío y el dominio trata los días como secos.
 */
export async function obtenerClimaMensual(
  municipioId: string,
): Promise<ResultadoClima<ClimaMensual[]>> {
  const { data, error } = await supabase
    .from('clima_mensual')
    .select('*')
    .eq('municipio_id', municipioId)
    .order('mes');
  if (error) {
    return {
      ok: false,
      error: `No se pudo leer clima_mensual: ${error.message}`,
    };
  }
  const parseada = z.array(climaMensualSchema).safeParse(data ?? []);
  if (!parseada.success) {
    return {
      ok: false,
      error: `clima_mensual inválido: ${parseada.error.message}`,
    };
  }
  return { ok: true, datos: parseada.data };
}
