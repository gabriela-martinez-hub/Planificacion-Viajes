import { useState } from 'react';
import { t } from '@/i18n';
import { useAuth } from './use-auth';

/**
 * Botón de inicio o cierre de sesión con Google.
 * Muestra el saludo con el nombre cuando hay sesión.
 */
export function BotonAuth() {
  const { usuario, cargando, iniciarSesionGoogle, cerrarSesion } = useAuth();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);

  if (cargando) {
    return (
      <p className="text-sm text-slate-500" role="status">
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

  if (usuario) {
    const nombre =
      (usuario.user_metadata?.full_name as string | undefined) ??
      usuario.email ??
      '';
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-slate-700">{t('auth.saludo', { nombre })}</p>
        <button
          type="button"
          onClick={alCerrar}
          disabled={ocupado}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
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
        className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {t('auth.iniciarSesion')}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {t('auth.errorInicio')}
        </p>
      )}
      <p className="max-w-xs text-sm text-slate-500">{t('auth.sinCuenta')}</p>
    </div>
  );
}
