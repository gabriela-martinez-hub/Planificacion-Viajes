// Hook compuesto: obtiene el clima de todos los días de un viaje (T-18).
//
// Reúne el pronóstico (una llamada para todos los municipios base) y los
// promedios mensuales (una consulta) y los combina con el dominio puro
// (armarClimaViaje) para producir el detalle por día y el ClimaDia[] que
// alimenta al generador. Expone también si se está usando el respaldo de
// promedios (pronóstico no disponible), para el aviso de la UI.

import { useMemo } from 'react';
import type { Municipio } from '@/domain/catalogo/esquemas';
import {
  aClimaDia,
  armarClimaViaje,
  type ClimaDiaDetalle,
  type DiaBase,
  type PronosticoDia,
} from '@/domain/clima';
import type { ClimaDia } from '@/domain/itinerario';
import type { Lugar } from '@/services/clima';
import { usePronostico, useClimaMensualVarios } from './use-clima';

export interface ResultadoClimaViaje {
  /** Detalle por día (orden de `dias`), para el indicador visual. */
  detalles: ClimaDiaDetalle[];
  /** Clima reducido para el generador: { fecha, lluvioso }[]. */
  climaPorDia: ClimaDia[];
  /** true mientras se cargan el pronóstico o los promedios. */
  cargando: boolean;
  /** true si el pronóstico no está disponible y se usa el respaldo histórico. */
  usandoPromedio: boolean;
}

/**
 * Calcula el clima de un viaje a partir de sus días (fecha + municipio base).
 * `municipiosPorId` aporta lat/lon/altitud para pedir el pronóstico por lugar.
 */
export function useClimaViaje(
  dias: DiaBase[],
  municipiosPorId: Map<string, Municipio>,
  hoy: string,
): ResultadoClimaViaje {
  // Municipios base distintos del viaje (en orden estable).
  const basesIds = useMemo(() => {
    const vistos = new Set<string>();
    const ids: string[] = [];
    for (const d of dias) {
      if (!vistos.has(d.municipioBaseId)) {
        vistos.add(d.municipioBaseId);
        ids.push(d.municipioBaseId);
      }
    }
    return ids;
  }, [dias]);

  // Lugares a consultar en Open-Meteo (uno por municipio base).
  const lugares = useMemo<Lugar[]>(() => {
    const salida: Lugar[] = [];
    for (const id of basesIds) {
      const m = municipiosPorId.get(id);
      if (m) salida.push({ id, lat: m.lat, lon: m.lon, altitudM: m.altitud_m });
    }
    return salida;
  }, [basesIds, municipiosPorId]);

  const pronostico = usePronostico(lugares);
  const promedios = useClimaMensualVarios(basesIds);

  const resultado = useMemo<Omit<ResultadoClimaViaje, 'cargando'>>(() => {
    // Pronóstico por municipio: id → PronosticoDia[]. Vacío si falló la red.
    const pronosticoPorMunicipio = new Map<string, PronosticoDia[]>();
    let pronosticoOk = false;
    if (pronostico.data?.ok) {
      pronosticoOk = true;
      for (const p of pronostico.data.datos) {
        pronosticoPorMunicipio.set(p.id, p.dias);
      }
    }

    const promedioPorMunicipio = promedios.data?.ok
      ? promedios.data.datos
      : new Map();

    const detalles = armarClimaViaje({
      dias,
      hoy,
      pronosticoPorMunicipio,
      promedioPorMunicipio,
    });

    // Se usa el respaldo si el pronóstico falló pero hay días dentro de su
    // horizonte que lo habrían usado; de forma práctica: si no hubo pronóstico
    // y algún día quedó clasificado por promedio. El aviso solo tiene sentido
    // cuando el pronóstico falló (no cuando todos los días son lejanos).
    const usandoPromedio =
      !pronosticoOk && detalles.some((d) => d.fuente === 'promedio');

    return { detalles, climaPorDia: aClimaDia(detalles), usandoPromedio };
  }, [dias, hoy, pronostico.data, promedios.data]);

  return {
    ...resultado,
    cargando: pronostico.isLoading || promedios.isLoading,
  };
}
