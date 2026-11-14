// Utilidades de animación compartidas (Framer Motion). Centralizan las
// "variants" para que el movimiento sea consistente y respeten la preferencia
// de reducir animación (accesibilidad, igual que el CSS global).
import { useReducedMotion, type Variants } from 'framer-motion';

/** Contenedor que escalona la entrada de sus hijos. */
export const contenedorStagger: Variants = {
  oculto: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

/** Elemento que entra desde abajo con un leve fundido. */
export const entradaItem: Variants = {
  oculto: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

/** Transición entre páginas al cambiar de ruta. */
export const transicionPagina: Variants = {
  inicial: { opacity: 0, y: 14 },
  entra: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  sale: { opacity: 0, y: -10, transition: { duration: 0.18, ease: 'easeIn' } },
};

/**
 * Devuelve las props de animación o, si el usuario pide menos movimiento, un
 * objeto vacío para que los componentes se rendericen sin animar.
 */
export function useMovimiento() {
  const reducir = useReducedMotion();
  return {
    reducir: reducir ?? false,
    /** Props para un contenedor con entrada escalonada. */
    propsContenedor: reducir
      ? {}
      : { variants: contenedorStagger, initial: 'oculto', animate: 'visible' },
    /** Props para cada hijo del contenedor. */
    propsItem: reducir ? {} : { variants: entradaItem },
  };
}
