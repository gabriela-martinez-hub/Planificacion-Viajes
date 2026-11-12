// Hook para eliminar la cuenta del usuario y todos sus datos (T-21, plan.md
// 6.4). Tras el borrado: cierra sesión, limpia la caché de TanStack Query y
// deja que el gating por sesión muestre el estado sin cuenta.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eliminarMiCuenta } from '@/services/perfil';
import { supabase } from '@/services/supabase';

export function useEliminarCuenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eliminarMiCuenta,
    onSuccess: async () => {
      // La cuenta ya no existe: cerramos sesión (ignoramos un posible error de
      // sesión inválida, el objetivo es no quedar autenticado) y limpiamos la
      // caché para no mostrar datos del usuario borrado.
      try {
        await supabase.auth.signOut();
      } catch {
        // Sin acción: el onAuthStateChange pondrá la sesión en null igualmente.
      }
      qc.clear();
    },
  });
}
