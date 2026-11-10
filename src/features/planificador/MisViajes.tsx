// Vista "Mis viajes" (T-14, pieza A): lista los viajes guardados del usuario y
// abre uno reconstruyendo la vista día por día. Requiere sesión.
import { useMemo, useState } from 'react';
import { t } from '@/i18n';
import { useAuth } from '@/features/auth/use-auth';
import {
  useMunicipios,
  useAtracciones,
} from '@/features/catalogo/use-catalogo';
import { useViajes, useDetalleViaje, useEliminarViaje } from './use-viajes';
import { reconstruirItinerario, type ViajeItemFila } from './persistir';
import { VistaItinerario } from './VistaItinerario';

export function MisViajes() {
  const { usuario } = useAuth();
  const viajes = useViajes(usuario !== null);
  const eliminar = useEliminarViaje();
  const [abierto, setAbierto] = useState<string | null>(null);

  if (!usuario) {
    return (
      <p className="text-slate-500">{t('planificador.iniciaParaVerViajes')}</p>
    );
  }

  if (abierto) {
    return <DetalleViaje viajeId={abierto} alVolver={() => setAbierto(null)} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-emerald-800">
        {t('nav.misViajes')}
      </h2>

      {viajes.isLoading && (
        <p className="text-slate-500" role="status">
          {t('comun.cargando')}
        </p>
      )}
      {viajes.error && (
        <p className="text-red-600" role="alert">
          {t('comun.errorGenerico')}
        </p>
      )}

      {viajes.data && viajes.data.length === 0 && (
        <p className="text-slate-500">{t('planificador.sinViajes')}</p>
      )}

      <ul className="flex flex-col gap-2">
        {(viajes.data ?? []).map((v) => (
          <li
            key={v.id}
            className="flex items-center gap-2 rounded-lg border border-slate-200 p-3"
          >
            <button
              type="button"
              onClick={() => setAbierto(v.id)}
              className="flex-1 text-left"
            >
              <span className="block font-medium text-slate-800">
                {v.titulo}
              </span>
              <span className="block text-xs text-slate-500">
                {v.fecha_inicio} → {v.fecha_fin}
              </span>
            </button>
            <button
              type="button"
              onClick={() => eliminar.mutate(v.id)}
              disabled={eliminar.isPending}
              className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              aria-label={t('comun.eliminar')}
            >
              {t('comun.eliminar')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface DetalleProps {
  viajeId: string;
  alVolver: () => void;
}

function DetalleViaje({ viajeId, alVolver }: DetalleProps) {
  const detalle = useDetalleViaje(viajeId);
  const municipios = useMunicipios();
  const atracciones = useAtracciones();

  const nombreMunicipio = useMemo(() => {
    const mapa = new Map((municipios.data ?? []).map((m) => [m.id, m.nombre]));
    return (id: string) => mapa.get(id) ?? id;
  }, [municipios.data]);

  const descripcionItem = useMemo(() => {
    const atr = new Map((atracciones.data ?? []).map((a) => [a.id, a.nombre]));
    return (item: ViajeItemFila) => {
      if (item.tipo === 'actividad' && item.atraccion_id) {
        return atr.get(item.atraccion_id) ?? item.atraccion_id;
      }
      return t(`planificador.tipoItem.${item.tipo}`);
    };
  }, [atracciones.data]);

  const itinerario = useMemo(() => {
    if (!detalle.data) return null;
    return reconstruirItinerario(
      detalle.data.dias,
      detalle.data.items,
      descripcionItem,
    );
  }, [detalle.data, descripcionItem]);

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={alVolver}
        className="self-start text-sm text-emerald-700 hover:underline"
      >
        ← {t('comun.volver')}
      </button>

      {(detalle.isLoading || municipios.isLoading || atracciones.isLoading) && (
        <p className="text-slate-500" role="status">
          {t('comun.cargando')}
        </p>
      )}
      {detalle.error && (
        <p className="text-red-600" role="alert">
          {t('comun.errorGenerico')}
        </p>
      )}

      {itinerario && (
        <VistaItinerario
          itinerario={itinerario}
          nombreMunicipio={nombreMunicipio}
          ordenManual={false}
          soloLectura
          alSubir={() => {}}
          alBajar={() => {}}
          alFijar={() => {}}
          alMoverDestino={() => {}}
        />
      )}
    </section>
  );
}
