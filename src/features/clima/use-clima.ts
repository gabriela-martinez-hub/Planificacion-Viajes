// Hooks de clima con TanStack Query y caché de 3 h (T-17, plan.md 6.3).
//
// El pronóstico de Open-Meteo cambia poco en 3 h y la cuota gratuita es
// limitada, así que se cachea con staleTime de 3 h (plan.md 1.1: uso académico
// de bajo tráfico). Ante un fallo de red o validación, el servicio devuelve un
// resultado tipado { ok: false }; estos hooks lo propagan tal cual para que la
// UI (T-18) caiga al promedio histórico con aviso.

import { useQuery } from '@tanstack/react-query';
import {
  obtenerClimaMensual,
  obtenerClimaMensualVarios,
  obtenerPronostico,
  type Lugar,
  type PronosticoLugar,
  type ResultadoClima,
} from '@/services/clima';
import type { ClimaMensual } from '@/domain/catalogo/esquemas';

/** Caché del pronóstico: fresco 3 h (plan.md 6.3). */
const TRES_HORAS_MS = 1000 * 60 * 60 * 3;

/** Clave estable por conjunto de lugares (ordenada para no duplicar caché). */
function claveLugares(lugares: Lugar[]): string {
  return lugares
    .map((l) => `${l.id}:${l.lat.toFixed(4)},${l.lon.toFixed(4)}`)
    .sort()
    .join('|');
}

export const clavesClima = {
  pronostico: (lugares: Lugar[]) =>
    ['clima', 'pronostico', claveLugares(lugares)] as const,
  mensual: (municipioId: string) => ['clima', 'mensual', municipioId] as const,
  mensualVarios: (ids: string[]) =>
    ['clima', 'mensual-varios', [...ids].sort().join(',')] as const,
};

/**
 * Pronóstico de 16 días para un conjunto de lugares (una sola llamada a
 * Open-Meteo). Deshabilitado si no hay lugares. Devuelve el resultado tipado
 * del servicio (ok/no-ok) como dato de la query, no como error de la query:
 * un fallo de la API es un estado esperado (se usa el promedio), no una
 * excepción de la app.
 */
export function usePronostico(lugares: Lugar[]) {
  return useQuery<ResultadoClima<PronosticoLugar[]>>({
    queryKey: clavesClima.pronostico(lugares),
    queryFn: () => obtenerPronostico(lugares),
    enabled: lugares.length > 0,
    staleTime: TRES_HORAS_MS,
    gcTime: TRES_HORAS_MS * 2,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** Promedios mensuales de un municipio (clima_mensual del seed). */
export function useClimaMensual(municipioId: string | undefined) {
  return useQuery<ResultadoClima<ClimaMensual[]>>({
    queryKey: clavesClima.mensual(municipioId ?? ''),
    queryFn: () => obtenerClimaMensual(municipioId as string),
    enabled: Boolean(municipioId),
    // Los promedios no cambian; se pueden cachear más tiempo que el pronóstico.
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** Promedios mensuales de varios municipios (un solo query). */
export function useClimaMensualVarios(municipioIds: string[]) {
  return useQuery<ResultadoClima<Map<string, ClimaMensual[]>>>({
    queryKey: clavesClima.mensualVarios(municipioIds),
    queryFn: () => obtenerClimaMensualVarios(municipioIds),
    enabled: municipioIds.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
