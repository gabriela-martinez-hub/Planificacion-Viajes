// Panel de clima del planificador (T-18, plan.md 6.1 paso 9 y 6.3).
//
// Muestra la atribución de Open-Meteo, un aviso si se está usando el respaldo de
// promedios históricos, y el botón "Reorganizar por clima" con vista previa:
// calcula un itinerario candidato (dominio reorganizarPorClima) que mueve las
// actividades al aire libre a los días secos sin tocar las fijadas, lo muestra
// en modo solo lectura y solo lo aplica si el usuario confirma.

import { useState } from 'react';
import { t } from '@/i18n';
import type { Atraccion } from '@/domain/catalogo/esquemas';
import {
  reorganizarPorClima,
  type ClimaDia,
  type Itinerario,
} from '@/domain/itinerario';
import type { ClimaDiaDetalle } from '@/domain/clima';
import { VistaItinerario } from './VistaItinerario';

interface Props {
  itinerario: Itinerario;
  detalles: ClimaDiaDetalle[];
  climaPorDia: ClimaDia[];
  atracciones: Atraccion[];
  limiteJornadaMin: number;
  cargandoClima: boolean;
  usandoPromedio: boolean;
  nombreMunicipio: (id: string) => string;
  /** Aplica el itinerario reorganizado (lo sube al estado del planificador). */
  alAplicar: (itinerario: Itinerario) => void;
}

export function PanelClima({
  itinerario,
  detalles,
  climaPorDia,
  atracciones,
  limiteJornadaMin,
  cargandoClima,
  usandoPromedio,
  nombreMunicipio,
  alAplicar,
}: Props) {
  // Candidato de la vista previa: null = no hay vista previa abierta.
  const [candidato, setCandidato] = useState<Itinerario | null>(null);
  const [sinCambios, setSinCambios] = useState(false);

  const climaPorFecha = new Map(detalles.map((d) => [d.fecha, d]));

  const alReorganizar = () => {
    setSinCambios(false);
    const r = reorganizarPorClima(itinerario, {
      atracciones,
      climaPorDia,
      limiteJornadaMin,
    });
    if (!r.cambio) {
      setCandidato(null);
      setSinCambios(true);
      return;
    }
    setCandidato(r.candidato);
  };

  const alAplicarCandidato = () => {
    if (candidato) alAplicar(candidato);
    setCandidato(null);
  };

  const hayLluvia = detalles.some((d) => d.lluvioso);

  return (
    <div className="flex flex-col gap-3 tarjeta">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-tinta-900">
          {t('clima.pronostico')}
        </h3>
        <span className="text-xs text-tinta-500">{t('clima.atribucion')}</span>
      </div>

      {usandoPromedio && (
        <p
          className="rounded-md bg-ambar-50 p-2 text-sm text-ambar-800"
          role="status"
        >
          {t('clima.avisoSinRed')}
        </p>
      )}

      <p className="text-xs text-tinta-500">{t('clima.reorganizarAyuda')}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={alReorganizar}
          disabled={cargandoClima || !hayLluvia || candidato !== null}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-crema-claro enabled:hover:bg-sky-700 disabled:opacity-40"
        >
          {t('clima.reorganizar')}
        </button>
        {cargandoClima && (
          <span className="text-xs text-tinta-500" role="status">
            {t('comun.cargando')}
          </span>
        )}
      </div>

      {sinCambios && (
        <p className="text-sm text-tinta-600" role="status">
          {t('clima.sinCambios')}
        </p>
      )}

      {candidato && (
        <div className="flex flex-col gap-3 rounded-md border border-sky-200 bg-sky-50/40 p-3">
          <h4 className="font-medium text-tinta-900">
            {t('clima.vistaPrevia')}
          </h4>
          <VistaItinerario
            itinerario={candidato}
            nombreMunicipio={nombreMunicipio}
            ordenManual={false}
            soloLectura
            climaPorFecha={climaPorFecha}
            alSubir={() => {}}
            alBajar={() => {}}
            alFijar={() => {}}
            alMoverDestino={() => {}}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={alAplicarCandidato}
              className="rounded-md bg-selva-600 px-3 py-1.5 text-sm font-medium text-crema-claro hover:bg-selva-700"
            >
              {t('clima.aplicar')}
            </button>
            <button
              type="button"
              onClick={() => setCandidato(null)}
              className="rounded-md border border-tinta-300 px-3 py-1.5 text-sm text-tinta-700 hover:bg-crema-oscuro"
            >
              {t('clima.descartar')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
