// Modal de confirmación para eliminar la cuenta y los datos (T-21, plan.md 6.4).
// Acción destructiva e irreversible: el botón de confirmar va en rojo.

import { t } from '@/i18n';
import { useModalAccesible } from '@/lib/use-modal-accesible';
import { useEliminarCuenta } from './use-eliminar-cuenta';

interface Props {
  /** Se llama tras eliminar la cuenta con éxito. */
  alEliminar: () => void;
  alCancelar: () => void;
}

export function ModalEliminarCuenta({ alEliminar, alCancelar }: Props) {
  const eliminar = useEliminarCuenta();
  const refDialogo = useModalAccesible(alCancelar);

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
      <div
        ref={refDialogo}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-crema-claro p-5 shadow-papel"
      >
        <h2
          id="eliminar-titulo"
          className="text-lg font-semibold text-tinta-900"
        >
          {t('perfil.eliminarCuenta')}
        </h2>
        <p className="mt-3 text-sm text-tinta-600">
          {t('perfil.confirmarEliminar')}
        </p>
        {eliminar.isError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {t('comun.errorGenerico')}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={alCancelar}
            disabled={eliminar.isPending}
            className="boton-secundario"
          >
            {t('comun.cancelar')}
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={eliminar.isPending}
            className="boton-peligro"
          >
            {t('perfil.eliminarConfirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
