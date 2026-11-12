// Modal de confirmación para eliminar la cuenta y los datos (T-21, plan.md 6.4).
// Acción destructiva e irreversible: el botón de confirmar va en rojo.

import { t } from '@/i18n';
import { useEliminarCuenta } from './use-eliminar-cuenta';

interface Props {
  /** Se llama tras eliminar la cuenta con éxito. */
  alEliminar: () => void;
  alCancelar: () => void;
}

export function ModalEliminarCuenta({ alEliminar, alCancelar }: Props) {
  const eliminar = useEliminarCuenta();

  async function confirmar() {
    try {
      await eliminar.mutateAsync();
      alEliminar();
    } catch {
      // El error queda reflejado en eliminar.isError; el modal permanece abierto.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eliminar-titulo"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2
          id="eliminar-titulo"
          className="text-lg font-semibold text-slate-800"
        >
          {t('perfil.eliminarCuenta')}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          {t('perfil.confirmarEliminar')}
        </p>
        {eliminar.isError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {t('comun.errorGenerico')}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={alCancelar}
            disabled={eliminar.isPending}
            className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {t('comun.cancelar')}
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={eliminar.isPending}
            className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {t('perfil.eliminarConfirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
