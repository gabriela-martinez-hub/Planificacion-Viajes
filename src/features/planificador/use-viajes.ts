// Hooks de viajes del usuario con TanStack Query (T-14, pieza A).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  guardarViaje,
  listarViajes,
  obtenerDetalleViaje,
  eliminarViaje,
} from '@/services/viajes';
import type { ViajePersistible } from './persistir';

const clavesViajes = {
  lista: ['viajes', 'lista'] as const,
  detalle: (id: string) => ['viajes', 'detalle', id] as const,
};

/** Lista los viajes del usuario. Habilitar solo con sesión. */
export function useViajes(habilitado: boolean) {
  return useQuery({
    queryKey: clavesViajes.lista,
    queryFn: listarViajes,
    enabled: habilitado,
  });
}

/** Detalle (días e ítems) de un viaje. */
export function useDetalleViaje(viajeId: string | null) {
  return useQuery({
    queryKey: clavesViajes.detalle(viajeId ?? ''),
    queryFn: () => obtenerDetalleViaje(viajeId as string),
    enabled: viajeId !== null,
  });
}

/** Guarda un viaje y refresca la lista. */
export function useGuardarViaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ViajePersistible) => guardarViaje(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clavesViajes.lista });
    },
  });
}

/** Elimina un viaje y refresca la lista. */
export function useEliminarViaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (viajeId: string) => eliminarViaje(viajeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clavesViajes.lista });
    },
  });
}
