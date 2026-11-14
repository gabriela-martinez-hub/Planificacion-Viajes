// Barra lateral de navegación (solo escritorio). Enlaces verticales con icono
// dinámico; el activo se resalta con una "pastilla" verde animada compartida
// (layoutId) para que se deslice entre secciones.
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { t, tTexto } from '@/i18n';
import { ITEMS_NAV } from './navegacion';

export function Sidebar() {
  const reducir = useReducedMotion();

  return (
    <nav
      className="sticky top-20 hidden h-fit w-56 shrink-0 flex-col gap-1 rounded-sello border border-crema-oscuro bg-crema-claro p-3 shadow-papel md:flex"
      aria-label={t('nav.seccion')}
    >
      {ITEMS_NAV.map(({ to, etiqueta, icono: Icono }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `nav-lateral ${isActive ? 'nav-lateral-activo' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive &&
                (reducir ? (
                  <span
                    className="absolute inset-0 rounded-2xl bg-selva-700"
                    aria-hidden="true"
                  />
                ) : (
                  <motion.span
                    layoutId="sidebar-activo"
                    className="absolute inset-0 rounded-2xl bg-selva-700"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    aria-hidden="true"
                  />
                ))}
              <span className="relative z-10 flex items-center gap-3">
                <Icono className="h-5 w-5" aria-hidden="true" />
                {tTexto(etiqueta)}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
