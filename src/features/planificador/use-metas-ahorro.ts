// Hooks de meta de ahorro y aportes con TanStack Query (T-16, modo soñado).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  guardarMeta,
  obtenerMeta,
  listarAportes,
  registrarAporte,
  type MetaAhorro,
} from '@/services/metas-ahorro';

const claves = {
  meta: (viajeId: string) => ['meta-ahorro', viajeId] as const,
  aportes: (viajeId: string) => ['aportes-ahorro', viajeId] as const,
};

/** Meta de un viaje (null si no tiene). Habilitar solo con viajeId. */
export function useMeta(viajeId: string | null) {
  return useQuery({
    queryKey: claves.meta(viajeId ?? ''),
    queryFn: () => obtenerMeta(viajeId as string),
    enabled: viajeId !== null,
  });
}

/** Aportes de un viaje. */
export function useAportes(viajeId: string | null) {
  return useQuery({
    queryKey: claves.aportes(viajeId ?? ''),
    queryFn: () => listarAportes(viajeId as string),
    enabled: viajeId !== null,
  });
}

/** Crea o actualiza la meta y refresca su consulta. */
export function useGuardarMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meta: MetaAhorro) => guardarMeta(meta),
    onSuccess: (_d, meta) => {
      void qc.invalidateQueries({ queryKey: claves.meta(meta.viaje_id) });
    },
  });
}

/** Registra un aporte y refresca la lista de aportes del viaje. */
export function useRegistrarAporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { viajeId: string; fecha: string; montoCop: number }) =>
      registrarAporte(v.viajeId, v.fecha, v.montoCop),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: claves.aportes(v.viajeId) });
    },
  });
}
