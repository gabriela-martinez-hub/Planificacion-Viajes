// Accesibilidad de un modal (T-28): cerrar con la tecla Escape, llevar el foco
// al diálogo al abrir y devolverlo al elemento que lo abrió al cerrar.
//
// Devuelve una ref para el contenedor del diálogo. El consumidor la asigna al
// div con role="dialog" y pasa alCerrar para la tecla Escape.

import { useEffect, useRef } from 'react';

export function useModalAccesible(alCerrar: () => void) {
  const refDialogo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guarda el elemento con foco para restaurarlo al cerrar.
    const previo = document.activeElement as HTMLElement | null;

    // Lleva el foco al diálogo (o a su primer control enfocable).
    const dialogo = refDialogo.current;
    const enfocable = dialogo?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (enfocable ?? dialogo)?.focus();

    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        alCerrar();
      }
    };
    document.addEventListener('keydown', alTecla);

    return () => {
      document.removeEventListener('keydown', alTecla);
      previo?.focus?.();
    };
  }, [alCerrar]);

  return refDialogo;
}
