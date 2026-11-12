// Hook del consentimiento de datos (T-20, plan.md 6.4). Lee si el usuario ya lo
// dio y permite registrarlo. La query se habilita solo con sesión.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  obtenerConsentimiento,
  guardarConsentimiento,
} from '@/services/perfil';

const clave = ['perfil', 'consentimiento'] as const;

/** Fecha ISO del consentimiento o null. Solo consulta con sesión. */
export function useConsentimiento(habilitado: boolean) {
  return useQuery({
    queryKey: clave,
    queryFn: obtenerConsentimiento,
    enabled: habilitado,
  });
}

/** Registra el consentimiento y refresca la query. */
export function useGuardarConsentimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guardarConsentimiento,
    onSuccess: (fecha) => {
      qc.setQueryData(clave, fecha);
    },
  });
}
