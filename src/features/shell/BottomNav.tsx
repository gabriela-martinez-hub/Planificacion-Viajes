// Barra de navegación inferior (solo móvil). Patrón de app: iconos grandes con
// rótulo pequeño; el activo se eleva con un punto ámbar animado.
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { t, tTexto } from '@/i18n';
import { ITEMS_NAV } from './navegacion';

export function BottomNav() {
  const reducir = useReducedMotion();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-crema-oscuro bg-crema-claro/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label={t('nav.principal')}
    >
      <ul className="mx-auto flex max-w-md items-stretch gap-1 px-2 py-1">
        {ITEMS_NAV.map(({ to, etiqueta, icono: Icono }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `nav-inferior ${isActive ? 'nav-inferior-activo' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.span
                    animate={
                      reducir
                        ? undefined
                        : { scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }
                    }
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isActive ? 'bg-selva-700 text-crema-claro' : ''
                    }`}
                  >
                    <Icono className="h-5 w-5" aria-hidden="true" />
                  </motion.span>
                  <span>{tTexto(etiqueta)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
