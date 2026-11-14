// Vista "Mis viajes" (T-14, pieza A): lista los viajes guardados del usuario y
// abre uno reconstruyendo la vista día por día. Requiere sesión.
import { useMemo, useState } from 'react';
import { Luggage, Trash2 } from 'lucide-react';
import { t } from '@/i18n';
import { PaginaAnimada } from '@/features/shell/PaginaAnimada';
import { useAuth } from '@/features/auth/use-auth';
import {
  useMunicipios,
  useAtracciones,
} from '@/features/catalogo/use-catalogo';
import { useViajes, useDetalleViaje, useEliminarViaje } from './use-viajes';
import { reconstruirItinerario, type ViajeItemFila } from './persistir';
import { PanelMetaAhorro } from './PanelMetaAhorro';
import { VistaItinerario } from './VistaItinerario';
import type { ViajeResumen } from '@/services/viajes';

export function MisViajes() {
  const { usuario } = useAuth();
  const viajes = useViajes(usuario !== null);
  const eliminar = useEliminarViaje();
  const [abierto, setAbierto] = useState<ViajeResumen | null>(null);

  if (!usuario) {
    return (
      <p className="text-tinta-500">{t('planificador.iniciaParaVerViajes')}</p>
    );
  }

  if (abierto) {
    return <DetalleViaje viaje={abierto} alVolver={() => setAbierto(null)} />;
  }

  return (
    <PaginaAnimada>
      <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ambar-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ambar-800">
          <Luggage className="h-3.5 w-3.5" aria-hidden="true" />
          {t('nav.misViajes')}
        </span>
        <h2 className="sello-titulo text-2xl">{t('nav.misViajes')}</h2>
      </header>

      {viajes.isLoading && (
        <p className="text-tinta-500" role="status">
          {t('comun.cargando')}
        </p>
      )}
      {viajes.error && (
        <p className="text-red-700" role="alert">
          {t('comun.errorGenerico')}
        </p>
      )}

      {viajes.data && viajes.data.length === 0 && (
        <p className="text-tinta-500">{t('planificador.sinViajes')}</p>
      )}

      <ul className="flex flex-col gap-2">
        {(viajes.data ?? []).map((v) => (
          <li
            key={v.id}
            className="flex items-center gap-3 rounded-2xl border border-crema-oscuro bg-crema-claro p-3 shadow-papel transition-colors hover:border-selva-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-selva-100 text-selva-700">
              <Luggage className="h-5 w-5" aria-hidden="true" />
            </span>
            <button
              type="button"
              onClick={() => setAbierto(v)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate font-medium text-tinta-900">
                {v.titulo}
              </span>
              <span className="block text-xs text-tinta-500">
                {v.fecha_inicio} → {v.fecha_fin}
              </span>
            </button>
            <button
              type="button"
              onClick={() => eliminar.mutate(v.id)}
              disabled={eliminar.isPending}
              className="inline-flex items-center rounded-full px-2 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
              aria-label={t('comun.eliminar')}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      </section>
    </PaginaAnimada>
  );
}

interface DetalleProps {
  viaje: ViajeResumen;
  alVolver: () => void;
}

function DetalleViaje({ viaje, alVolver }: DetalleProps) {
  const viajeId = viaje.id;
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
        className="self-start text-sm text-selva-700 hover:underline"
      >
        ← {t('comun.volver')}
      </button>

      {(detalle.isLoading || municipios.isLoading || atracciones.isLoading) && (
        <p className="text-tinta-500" role="status">
          {t('comun.cargando')}
        </p>
      )}
      {detalle.error && (
        <p className="text-red-700" role="alert">
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

      {itinerario && (
        <PanelMetaAhorro
          viajeId={viajeId}
          fechaInicio={viaje.fecha_inicio}
          totalSugeridoCop={itinerario.costos.total}
        />
      )}
    </section>
  );
}
