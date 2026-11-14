import { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { t } from '@/i18n';
import { useAuth } from './use-auth';

interface Props {
  /** Variante compacta para la barra superior: solo controles, sin textos de
   *  ayuda ni el saludo largo. */
  compacto?: boolean;
}

/**
 * Botón de inicio o cierre de sesión con Google.
 * Muestra el saludo con el nombre cuando hay sesión.
 */
export function BotonAuth({ compacto = false }: Props) {
  const { usuario, cargando, iniciarSesionGoogle, cerrarSesion } = useAuth();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);

  if (cargando) {
    return (
      <p className="text-sm text-tinta-500" role="status">
        {t('comun.cargando')}
      </p>
    );
  }

  async function alIniciar() {
    setError(false);
    setOcupado(true);
    try {
      await iniciarSesionGoogle();
      // Si todo va bien, el navegador redirige a Google y no se vuelve aquí.
    } catch {
      setError(true);
      setOcupado(false);
    }
  }

  async function alCerrar() {
    setOcupado(true);
    try {
      await cerrarSesion();
    } finally {
      setOcupado(false);
    }
  }

  const nombre = usuario
    ? ((usuario.user_metadata?.full_name as string | undefined) ??
      usuario.email ??
      '')
    : '';

  // ---- Variante compacta (barra superior) ----
  if (compacto) {
    if (usuario) {
      const inicial = (nombre.trim()[0] ?? '?').toUpperCase();
      return (
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ambar-200 font-bold text-ambar-900"
            title={nombre}
            aria-hidden="true"
          >
            {inicial}
          </span>
          <button
            type="button"
            onClick={alCerrar}
            disabled={ocupado}
            className="inline-flex items-center gap-1.5 rounded-full border border-tinta-300 bg-crema-claro px-3 py-1.5 text-sm font-medium text-tinta-700 transition-colors hover:bg-crema-oscuro disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('auth.cerrarSesion')}</span>
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={alIniciar}
        disabled={ocupado}
        className="inline-flex items-center gap-1.5 boton-primario px-4 py-1.5 text-sm"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {t('auth.iniciarSesion')}
      </button>
    );
  }

  // ---- Variante completa (dentro de secciones) ----
  if (usuario) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-tinta-700">{t('auth.saludo', { nombre })}</p>
        <button
          type="button"
          onClick={alCerrar}
          disabled={ocupado}
          className="boton-secundario"
        >
          {t('auth.cerrarSesion')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={alIniciar}
        disabled={ocupado}
        className="boton-primario"
      >
        {t('auth.iniciarSesion')}
      </button>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {t('auth.errorInicio')}
        </p>
      )}
      <p className="max-w-xs text-sm text-tinta-500">{t('auth.sinCuenta')}</p>
    </div>
  );
}
