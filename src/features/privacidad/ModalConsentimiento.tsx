// Modal de consentimiento de datos (T-20, plan.md 6.4). Se muestra antes del
// primer check-in. Al aceptar, guarda consentimiento_datos_en en el perfil.

import { t } from '@/i18n';
import { useModalAccesible } from '@/lib/use-modal-accesible';
import { useGuardarConsentimiento } from './use-consentimiento';

interface Props {
  /** Se llama cuando el usuario acepta y queda guardado. */
  alAceptar: () => void;
  /** Se llama cuando el usuario cierra sin aceptar. */
  alCancelar: () => void;
}

export function ModalConsentimiento({ alAceptar, alCancelar }: Props) {
  const guardar = useGuardarConsentimiento();
  const refDialogo = useModalAccesible(alCancelar);

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
      <div
        ref={refDialogo}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-crema-claro p-5 shadow-papel"
      >
        <h2
          id="consentimiento-titulo"
          className="text-lg font-semibold text-tinta-900"
        >
          {t('privacidad.titulo')}
        </h2>
        <p className="mt-3 text-sm text-tinta-600">
          {t('privacidad.consentimiento')}
        </p>
        <a
          href="/politica-tratamiento-datos.md"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-selva-700 underline hover:text-selva-800"
        >
          {t('privacidad.verPolitica')}
        </a>
        {guardar.isError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {t('comun.errorGenerico')}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={alCancelar}
            disabled={guardar.isPending}
            className="boton-secundario"
          >
            {t('privacidad.rechazar')}
          </button>
          <button
            type="button"
            onClick={aceptar}
            disabled={guardar.isPending}
            className="boton-primario disabled:opacity-60"
          >
            {t('privacidad.aceptar')}
          </button>
        </div>
      </div>
    </div>
  );
}
