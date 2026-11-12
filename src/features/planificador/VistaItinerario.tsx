// Vista día por día del itinerario generado (T-13). Muestra cada día con su
// municipio base, sus ítems y los costos. Permite:
//  - reordenar los DESTINOS (municipios base); los traslados se recalculan y el
//    orden puede no ser el óptimo (se avisa);
//  - reordenar las actividades dentro de un día (subir/bajar) y fijarlas;
//  - los TRASLADOS quedan fijos: no se mueven ni se editan sueltos, porque los
//    gobierna el orden de destinos (si no, el día quedaría incoherente).
// Todo en memoria; persistir es T-14.
import { t } from '@/i18n';
import { formatearCOP } from '@/features/catalogo/formato';
import type { DiaItinerario, Itinerario } from '@/domain/itinerario';
import type { ClimaDiaDetalle } from '@/domain/clima';
import { ordenDestinos } from './editar-itinerario';

interface Props {
  itinerario: Itinerario;
  nombreMunicipio: (id: string) => string;
  /** true si el usuario reordenó los destinos (orden quizá no óptimo). */
  ordenManual: boolean;
  /** true para mostrar el itinerario sin controles de edición (viaje guardado). */
  soloLectura?: boolean;
  /** Detalle de clima por fecha 'AAAA-MM-DD', para el indicador por día (T-18). */
  climaPorFecha?: Map<string, ClimaDiaDetalle>;
  alSubir: (dia: number, orden: number) => void;
  alBajar: (dia: number, orden: number) => void;
  alFijar: (dia: number, orden: number) => void;
  alMoverDestino: (municipioId: string, direccion: 'arriba' | 'abajo') => void;
}

export function VistaItinerario({
  itinerario,
  nombreMunicipio,
  ordenManual,
  soloLectura = false,
  climaPorFecha,
  alSubir,
  alBajar,
  alFijar,
  alMoverDestino,
}: Props) {
  const destinos = ordenDestinos(itinerario);

  return (
    <section className="flex flex-col gap-4">
      {itinerario.avisos.length > 0 && (
        <ul
          className="rounded-md bg-amber-50 p-3 text-sm text-amber-800"
          role="status"
        >
          {itinerario.avisos.map((aviso, i) => (
            <li key={i}>⚠ {aviso}</li>
          ))}
        </ul>
      )}

      {!soloLectura && destinos.length > 1 && (
        <OrdenDestinos
          destinos={destinos}
          nombreMunicipio={nombreMunicipio}
          ordenManual={ordenManual}
          alMoverDestino={alMoverDestino}
        />
      )}

      {itinerario.dias.map((dia) => (
        <DiaCard
          key={dia.dia}
          dia={dia}
          nombreMunicipio={nombreMunicipio}
          soloLectura={soloLectura}
          clima={climaPorFecha?.get(dia.fecha)}
          alSubir={alSubir}
          alBajar={alBajar}
          alFijar={alFijar}
        />
      ))}

      <ResumenCostos itinerario={itinerario} />
    </section>
  );
}

// ------------------------------------------------------------ orden de destinos

interface OrdenDestinosProps {
  destinos: string[];
  nombreMunicipio: (id: string) => string;
  ordenManual: boolean;
  alMoverDestino: (municipioId: string, direccion: 'arriba' | 'abajo') => void;
}

function OrdenDestinos({
  destinos,
  nombreMunicipio,
  ordenManual,
  alMoverDestino,
}: OrdenDestinosProps) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-1 font-semibold text-slate-800">
        {t('planificador.ordenDestinos')}
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        {t('planificador.ordenDestinosAyuda')}
      </p>
      {ordenManual && (
        <p
          className="mb-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800"
          role="status"
        >
          {t('planificador.ordenNoOptimo')}
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {destinos.map((id, i) => (
          <li
            key={id}
            className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm"
          >
            <span className="flex-1 font-medium text-slate-800">
              {i + 1}. {nombreMunicipio(id)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => alMoverDestino(id, 'arriba')}
                disabled={i === 0}
                aria-label={t('planificador.subir')}
                className="rounded px-2 py-1 text-slate-600 enabled:hover:bg-slate-100 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => alMoverDestino(id, 'abajo')}
                disabled={i === destinos.length - 1}
                aria-label={t('planificador.bajar')}
                className="rounded px-2 py-1 text-slate-600 enabled:hover:bg-slate-100 disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ------------------------------------------------------------ día

// ------------------------------------------------------------ indicador de clima

/** Insignia de clima de un día: fuente (pronóstico/tendencia/estimación),
 *  probabilidad de lluvia y, si hay, el rango de temperatura. */
function IndicadorClima({ clima }: { clima: ClimaDiaDetalle }) {
  const prob = Math.round(clima.probabilidadLluvia * 100);
  const etiquetaFuente =
    clima.fuente === 'promedio'
      ? t('clima.estimacion')
      : clima.fuente === 'tendencia'
        ? t('clima.tendencia')
        : t('clima.pronostico');
  const temp =
    clima.tempMin !== undefined && clima.tempMax !== undefined
      ? ` · ${Math.round(clima.tempMin)}–${Math.round(clima.tempMax)}°C`
      : '';
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        clima.lluvioso
          ? 'bg-sky-100 text-sky-800'
          : 'bg-amber-100 text-amber-800'
      }`}
      title={`${etiquetaFuente}${temp}`}
    >
      {clima.lluvioso ? '🌧️' : '☀️'}{' '}
      {t('clima.lluvia', { probabilidad: `${prob}%` })}
    </span>
  );
}

interface DiaProps {
  dia: DiaItinerario;
  nombreMunicipio: (id: string) => string;
  soloLectura: boolean;
  clima?: ClimaDiaDetalle;
  alSubir: (dia: number, orden: number) => void;
  alBajar: (dia: number, orden: number) => void;
  alFijar: (dia: number, orden: number) => void;
}

function DiaCard({
  dia,
  nombreMunicipio,
  soloLectura,
  clima,
  alSubir,
  alBajar,
  alFijar,
}: DiaProps) {
  // Las actividades se reordenan entre ellas; los traslados quedan fijos como
  // anclas. Para subir/bajar una actividad, saltamos sobre los traslados: el
  // tope es la primera actividad y el fondo la última.
  const ordenesActividad = dia.items
    .filter((i) => i.tipo === 'actividad')
    .map((i) => i.orden);
  const primeraActividad = ordenesActividad[0];
  const ultimaActividad = ordenesActividad[ordenesActividad.length - 1];

  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">
            {t('planificador.dia', { numero: dia.dia })}
          </h3>
          <p className="text-xs text-slate-500">
            {dia.fecha} · {nombreMunicipio(dia.municipioBaseId)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {clima && <IndicadorClima clima={clima} />}
          {dia.lluvioso && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800">
              {t('planificador.diaLluvioso')}
            </span>
          )}
          {dia.soloTraslado && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {t('planificador.soloTraslado')}
            </span>
          )}
        </div>
      </header>

      <ol className="flex flex-col gap-2">
        {dia.items.map((item) => {
          const esTraslado = item.tipo === 'traslado';
          return (
            <li
              key={item.orden}
              className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                esTraslado
                  ? 'border-slate-300 bg-slate-50'
                  : item.fijado
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200'
              }`}
            >
              <span className="flex-1">
                <span className="font-medium text-slate-800">
                  {t(`planificador.tipoItem.${item.tipo}`)}
                </span>
                {': '}
                {item.descripcion}
                {item.costoCop > 0 && (
                  <span className="block text-xs text-slate-500">
                    {formatearCOP(item.costoCop)}
                  </span>
                )}
              </span>

              {soloLectura ? null : esTraslado ? (
                // El traslado es fijo: no se mueve ni se edita suelto. Su
                // destino se cambia reordenando los destinos arriba.
                <span
                  className="px-2 py-1 text-slate-400"
                  title={t('planificador.trasladoFijo')}
                  aria-label={t('planificador.trasladoFijo')}
                >
                  🔒
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => alSubir(dia.dia, item.orden)}
                    disabled={item.orden === primeraActividad}
                    aria-label={t('planificador.subir')}
                    className="rounded px-2 py-1 text-slate-600 enabled:hover:bg-slate-100 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => alBajar(dia.dia, item.orden)}
                    disabled={item.orden === ultimaActividad}
                    aria-label={t('planificador.bajar')}
                    className="rounded px-2 py-1 text-slate-600 enabled:hover:bg-slate-100 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => alFijar(dia.dia, item.orden)}
                    aria-pressed={item.fijado}
                    aria-label={
                      item.fijado
                        ? t('planificador.desfijar')
                        : t('planificador.fijar')
                    }
                    title={item.fijado ? t('planificador.fijado') : undefined}
                    className={`rounded px-2 py-1 ${
                      item.fijado
                        ? 'text-emerald-700'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {item.fijado ? '📌' : '📍'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function ResumenCostos({ itinerario }: { itinerario: Itinerario }) {
  const { costos } = itinerario;
  const filas: [string, number][] = [
    [t('presupuesto.desglose.transporte'), costos.transporte],
    [t('presupuesto.desglose.alojamiento'), costos.alojamiento],
    [t('presupuesto.desglose.comida'), costos.comida],
    [t('presupuesto.desglose.entradas'), costos.entradas + costos.actividades],
  ];
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-2 font-semibold text-slate-800">
        {t('presupuesto.titulo')}
      </h3>
      <dl className="flex flex-col gap-1 text-sm">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between">
            <dt className="text-slate-600">{etiqueta}</dt>
            <dd className="text-slate-800">{formatearCOP(valor)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold">
          <dt>{t('presupuesto.total')}</dt>
          <dd>{formatearCOP(costos.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
