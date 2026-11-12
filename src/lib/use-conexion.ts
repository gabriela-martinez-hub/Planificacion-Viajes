// Hook de estado de conexión del navegador (plan.md 6.4: el check-in requiere
// conexión; sin ella el botón se desactiva con un motivo). Se apoya en
// navigator.onLine y en los eventos online/offline de window.

import { useEffect, useState } from 'react';

/** true si el navegador se cree en línea. Reacciona a online/offline. */
export function useConexion(): boolean {
  const [enLinea, setEnLinea] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const aEnLinea = () => setEnLinea(true);
    const aFueraDeLinea = () => setEnLinea(false);
    window.addEventListener('online', aEnLinea);
    window.addEventListener('offline', aFueraDeLinea);
    // Sincroniza por si cambió entre el primer render y el efecto.
    setEnLinea(navigator.onLine);
    return () => {
      window.removeEventListener('online', aEnLinea);
      window.removeEventListener('offline', aFueraDeLinea);
    };
  }, []);

  return enLinea;
}
