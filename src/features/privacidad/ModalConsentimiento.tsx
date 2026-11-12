// Modal de consentimiento de datos (T-20, plan.md 6.4). Se muestra antes del
// primer check-in. Al aceptar, guarda consentimiento_datos_en en el perfil.

import { t } from '@/i18n';
import { useGuardarConsentimiento } from './use-consentimiento';

interface Props {
  /** Se llama cuando el usuario acepta y queda guardado. */
  alAceptar: () => void;
  /** Se llama cuando el usuario cierra sin aceptar. */
  alCancelar: () => void;
}

export function ModalConsentimiento({ alAceptar, alCancelar }: Props) {
  const guardar = useGuardarConsentimiento();

  async function aceptar() {
    try {
      await guardar.mutateAsync();
      alAceptar();
    } catch {
      // El error queda reflejado en guardar.isError; el modal permanece abierto.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consentimiento-titulo"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2
          id="consentimiento-titulo"
          className="text-lg font-semibold text-slate-800"
        >
          {t('privacidad.titulo')}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          {t('privacidad.consentimiento')}
        </p>
        <a
          href="/politica-tratamiento-datos.md"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-emerald-700 underline hover:text-emerald-800"
        >
          {t('privacidad.verPolitica')}
        </a>
        {guardar.isError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {t('comun.errorGenerico')}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={alCancelar}
            disabled={guardar.isPending}
            className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {t('privacidad.rechazar')}
          </button>
          <button
            type="button"
            onClick={aceptar}
            disabled={guardar.isPending}
            className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {t('privacidad.aceptar')}
          </button>
        </div>
      </div>
    </div>
  );
}
