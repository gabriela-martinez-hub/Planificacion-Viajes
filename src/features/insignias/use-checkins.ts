// Hooks de check-ins e insignias del usuario (T-20, plan.md 6.4).
//
// Registrar un check-in dispara el trigger del servidor que recalcula las
// insignias, así que tras el éxito invalidamos ambas queries.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  registrarCheckin,
  registrarCheckinManual,
  listarCheckins,
  listarInsigniasUsuario,
  type ArgsCheckin,
} from '@/services/checkins';

const claves = {
  checkins: ['checkins'] as const,
  insignias: ['insignias-usuario'] as const,
};

/** Lista los check-ins del usuario. Solo con sesión. */
export function useCheckins(habilitado: boolean) {
  return useQuery({
    queryKey: claves.checkins,
    queryFn: listarCheckins,
    enabled: habilitado,
  });
}

/** Lista las insignias obtenidas por el usuario. Solo con sesión. */
export function useInsigniasUsuario(habilitado: boolean) {
  return useQuery({
    queryKey: claves.insignias,
    queryFn: listarInsigniasUsuario,
    enabled: habilitado,
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: claves.checkins });
  void qc.invalidateQueries({ queryKey: claves.insignias });
}

/** Registra un check-in por GPS y refresca check-ins e insignias. */
export function useRegistrarCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: ArgsCheckin) => registrarCheckin(args),
    onSuccess: () => invalidar(qc),
  });
}

/** Registra un check-in manual (no verificado) y refresca las queries. */
export function useRegistrarCheckinManual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { lugarId: string; idCliente: string }) =>
      registrarCheckinManual(args),
    onSuccess: () => invalidar(qc),
  });
}
