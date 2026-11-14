// Progreso global del "álbum" (municipios visitados / total) para mostrarlo en
// la barra de navegación como un contador de estampas. Reutiliza el catálogo y
// los check-ins ya cacheados por TanStack Query.
import { useMemo } from 'react';
import { useMunicipios } from '@/features/catalogo/use-catalogo';
import { municipiosVisitados } from '@/domain/insignias/progreso';
import { useCheckins } from './use-checkins';

export interface ProgresoAlbum {
  visitados: number;
  total: number;
  /** Fracción 0–1 para barras o anillos de progreso. */
  fraccion: number;
}

export function useProgresoAlbum(habilitado: boolean): ProgresoAlbum {
  const municipios = useMunicipios();
  const checkins = useCheckins(habilitado);

  return useMemo(() => {
    const total = municipios.data?.length ?? 0;
    const visitados = habilitado
      ? municipiosVisitados(checkins.data ?? []).size
      : 0;
    return {
      visitados,
      total,
      fraccion: total === 0 ? 0 : visitados / total,
    };
  }, [municipios.data, checkins.data, habilitado]);
}
