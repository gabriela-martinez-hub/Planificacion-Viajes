// Barra superior fija: marca a la izquierda, contador de estampas del álbum y
// estado de sesión a la derecha. En móvil no muestra el sidebar; la navegación
// móvil vive en la barra inferior (BottomNav).
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { t } from '@/i18n';
import { useAuth } from '@/features/auth/use-auth';
import { useProgresoAlbum } from '@/features/insignias/use-progreso-album';
import { AnilloProgreso } from './AnilloProgreso';
import { BotonAuth } from '@/features/auth/BotonAuth';

export function TopBar() {
  const { usuario } = useAuth();
  const progreso = useProgresoAlbum(usuario !== null);

  return (
    <header className="sticky top-0 z-30 border-b border-crema-oscuro bg-crema-claro/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          to="/explorar"
          className="flex items-center gap-2"
          aria-label={t('nav.marca')}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-selva-700 text-crema-claro shadow-papel">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold text-selva-800">
              {t('nav.marca')}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-ambar-600">
              Caldas · Quindío · Risaralda
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {usuario && progreso.total > 0 && (
            <div
              className="hidden items-center gap-2 sm:flex"
              title={t('nav.progresoAlbum', {
                visitados: progreso.visitados,
                total: progreso.total,
              })}
            >
              <AnilloProgreso fraccion={progreso.fraccion}>
                {progreso.visitados}
              </AnilloProgreso>
              <span className="text-xs font-medium text-tinta-600">
                {t('nav.progresoAlbum', {
                  visitados: progreso.visitados,
                  total: progreso.total,
                })}
              </span>
            </div>
          )}
          <BotonAuth compacto />
        </div>
      </div>
    </header>
  );
}
