// Panel de presupuesto del planificador (T-15, plan.md 6.2 y 6.1 paso 8).
//
// Muestra el desglose del itinerario actual (total y por persona). Si el usuario
// escribe un monto fijo, ofrece ajustar el itinerario a ese monto; si no alcanza
// ni con el nivel económico sin actividades, muestra el mínimo y no ajusta.
//
// El cálculo vive en el dominio puro (domain/presupuesto); este componente solo
// presenta y delega.

import { useMemo, useState } from 'react';
import { t } from '@/i18n';
import { formatearCOP } from '@/features/catalogo/formato';
import {
  ajustarAPresupuesto,
  desglosar,
  type ResultadoAjuste,
} from '@/domain/presupuesto';
import type { EntradaItinerario, Itinerario } from '@/domain/itinerario';

interface Props {
  /** Itinerario actual (ya generado) para el desglose base. */
  itinerario: Itinerario;
  /** Entrada que lo generó, necesaria para recalcular al ajustar. */
  entrada: EntradaItinerario;
  /** Reemplaza el itinerario mostrado cuando el ajuste produce uno nuevo. */
  alAjustar?: (itinerario: Itinerario) => void;
}

export function PanelPresupuesto({ itinerario, entrada, alAjustar }: Props) {
  const [monto, setMonto] = useState('');
  const [resultado, setResultado] = useState<ResultadoAjuste | null>(null);

  const desglose = useMemo(
    () => desglosar(itinerario, entrada.viajeros),
    [itinerario, entrada.viajeros],
  );

  const alCalcular = () => {
    const valor = Number(monto);
    if (!Number.isFinite(valor) || valor <= 0) return;
    const r = ajustarAPresupuesto(entrada, Math.floor(valor));
    setResultado(r);
    if (r.ok && alAjustar) alAjustar(r.itinerario);
  };

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
      <h3 className="text-lg font-bold text-emerald-800">
        {t('presupuesto.titulo')}
      </h3>

      <Desglose grupo={desglose.grupo} porPersona={desglose.porPersona} />

      <p className="text-xs text-slate-500">{t('presupuesto.aproximado')}</p>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">{t('presupuesto.montoTotal')}</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={alCalcular}
          className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {t('presupuesto.calcular')}
        </button>
      </div>

      {resultado && !resultado.ok && (
        <p
          className="rounded-md bg-amber-50 p-3 text-sm text-amber-900"
          role="alert"
        >
          {t('presupuesto.noAlcanza', {
            minimo: formatearCOP(resultado.minimoCop),
          })}
        </p>
      )}

      {resultado && resultado.ok && resultado.ajustado && (
        <div
          className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900"
          role="status"
        >
          <p className="font-medium">{t('presupuesto.ajustado')}</p>
          <p>
            {t('presupuesto.nivelFinal', {
              alojamiento: t(
                `planificador.nivel.${resultado.nivelAlojamiento}`,
              ),
              comida: t(`planificador.nivel.${resultado.nivelComida}`),
            })}
          </p>
          {resultado.actividadesQuitadas.length > 0 && (
            <p>
              {t('presupuesto.actividadesQuitadas', {
                n: String(resultado.actividadesQuitadas.length),
              })}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

interface DesgloseProps {
  grupo: Itinerario['costos'];
  porPersona: Itinerario['costos'];
}

function Desglose({ grupo, porPersona }: DesgloseProps) {
  const filas: { etiqueta: string; valor: number }[] = [
    {
      etiqueta: t('presupuesto.desglose.transporte'),
      valor: grupo.transporte,
    },
    {
      etiqueta: t('presupuesto.desglose.alojamiento'),
      valor: grupo.alojamiento,
    },
    { etiqueta: t('presupuesto.desglose.comida'), valor: grupo.comida },
    {
      etiqueta: t('presupuesto.desglose.entradas'),
      valor: grupo.entradas + grupo.actividades,
    },
  ];
  return (
    <dl className="flex flex-col gap-1 text-sm">
      {filas.map((f) => (
        <div key={f.etiqueta} className="flex justify-between">
          <dt className="text-slate-600">{f.etiqueta}</dt>
          <dd className="text-slate-800">{formatearCOP(f.valor)}</dd>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-medium">
        <dt>{t('presupuesto.total')}</dt>
        <dd className="text-emerald-800">{formatearCOP(grupo.total)}</dd>
      </div>
      <div className="flex justify-between text-slate-500">
        <dt>{t('presupuesto.porPersona')}</dt>
        <dd>{formatearCOP(porPersona.total)}</dd>
      </div>
    </dl>
  );
}
