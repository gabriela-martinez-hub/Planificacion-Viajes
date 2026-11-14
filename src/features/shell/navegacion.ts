// Definición única de la navegación: rutas, etiquetas (i18n) e iconos. La usan
// la barra lateral (escritorio), la barra inferior (móvil) y el menú. Mantener
// una sola lista evita que se desincronicen.
import { Compass, Map, Luggage, BookMarked, type LucideIcon } from 'lucide-react';
import type { Clave } from '@/i18n';

export interface ItemNav {
  to: string;
  /** Clave i18n del rótulo (en nav.*). */
  etiqueta: Clave;
  icono: LucideIcon;
}

export const ITEMS_NAV: ItemNav[] = [
  { to: '/explorar', etiqueta: 'nav.explorar', icono: Compass },
  { to: '/planificar', etiqueta: 'nav.planificar', icono: Map },
  { to: '/mis-viajes', etiqueta: 'nav.misViajes', icono: Luggage },
  { to: '/perfil', etiqueta: 'nav.perfil', icono: BookMarked },
];
