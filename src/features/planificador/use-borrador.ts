// Hook del borrador local (T-14, pieza B). Lee el borrador de IndexedDB y
// expone acciones para guardarlo, borrarlo y subirlo a la cuenta.
import { useCallback, useEffect, useState } from 'react';
import type { Itinerario } from '@/domain/itinerario';
import type { FormularioViaje } from '@/domain/viaje/esquemas';
import {
  guardarBorrador,
  leerBorrador,
  borrarBorrador,
  type BorradorViaje,
} from './borrador-local';

export function useBorradorLocal() {
  const [borrador, setBorrador] = useState<BorradorViaje | null>(null);
  const [cargado, setCargado] = useState(false);

  const refrescar = useCallback(async () => {
    const b = await leerBorrador();
    setBorrador(b);
    setCargado(true);
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const guardar = useCallback(
    async (formulario: FormularioViaje, itinerario: Itinerario) => {
      await guardarBorrador(formulario, itinerario);
      await refrescar();
    },
    [refrescar],
  );

  const descartar = useCallback(async () => {
    await borrarBorrador();
    setBorrador(null);
  }, []);

  return { borrador, cargado, guardar, descartar, refrescar };
}
