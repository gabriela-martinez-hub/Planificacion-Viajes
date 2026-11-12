// Ficha de detalle de una atracción (T-09). Muestra descripción, estilos,
// duración, horario, costo con su aviso de aproximado y fuente, y los avisos de
// acceso (guía, estado). Todos los textos vienen del i18n.
import { t } from '@/i18n';
import type { Atraccion } from '@/domain/catalogo/esquemas';
import { BotonCheckin } from '@/features/insignias/BotonCheckin';
import { formatearCOP, nombresDias, soloHoraMin } from './formato';

interface Props {
  atraccion: Atraccion;
  nombreMunicipio: string;
  alVolver: () => void;
}

export function FichaAtraccion({
  atraccion,
  nombreMunicipio,
  alVolver,
}: Props) {
  const a = atraccion;
  const costoTotal = a.costo_entrada_cop + (a.costo_actividad_cop ?? 0);

  return (
    <article className="flex flex-col gap-4">
      <button
        type="button"
        onClick={alVolver}
        className="self-start text-sm text-emerald-700 hover:underline"
      >
        ← {t('catalogo.volverLista')}
      </button>

      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-emerald-800">{a.nombre}</h2>
        <p className="text-sm text-slate-500">
          {nombreMunicipio} · {a.categoria}
        </p>
      </header>

      {a.descripcion && <p className="text-slate-700">{a.descripcion}</p>}

      {a.estilos.length > 0 && (
        <ul
          className="flex flex-wrap gap-2"
          aria-label={t('catalogo.filtroEstilo')}
        >
          {a.estilos.map((e) => (
            <li
              key={e}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
            >
              {t(`catalogo.estilos.${e}`)}
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-slate-500">
            {t('catalogo.duracion')}
          </dt>
          <dd className="text-slate-700">
            {t('catalogo.minutos', { valor: a.duracion_min })}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase text-slate-500">
            {t('catalogo.horario')}
          </dt>
          <dd className="text-slate-700">
            {a.horario_apertura && a.horario_cierre
              ? t('catalogo.horas', {
                  apertura: soloHoraMin(a.horario_apertura),
                  cierre: soloHoraMin(a.horario_cierre),
                })
              : t('catalogo.sinHorario')}
          </dd>
        </div>

        {a.altitud_m !== undefined && (
          <div>
            <dt className="text-xs uppercase text-slate-500">
              {t('catalogo.altitud')}
            </dt>
            <dd className="text-slate-700">
              {t('catalogo.metros', { valor: a.altitud_m })}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-xs uppercase text-slate-500">
            {t('catalogo.entrada')}
          </dt>
          <dd className="text-slate-700">
            {costoTotal > 0 ? formatearCOP(costoTotal) : t('catalogo.gratis')}
          </dd>
        </div>
      </dl>

      {a.dias_cerrado.length > 0 && (
        <p className="text-sm text-amber-700">
          {t('catalogo.cerradoLos', { dias: nombresDias(a.dias_cerrado) })}
        </p>
      )}

      {a.requiere_guia && (
        <p className="text-sm text-amber-700">{t('catalogo.requiereGuia')}</p>
      )}

      {a.estado_acceso !== 'abierta' && (
        <p className="text-sm text-amber-700" role="note">
          {t(`catalogo.estadoAcceso.${a.estado_acceso}`)}
          {a.nota_acceso ? `: ${a.nota_acceso}` : ''}
        </p>
      )}

      <section
        className="border-t border-slate-200 pt-3"
        aria-label={t('checkin.registrar')}
      >
        <BotonCheckin
          lugar={{ id: a.id, nombre: a.nombre, lat: a.lat, lon: a.lon }}
        />
      </section>

      <footer className="flex flex-col gap-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
        {costoTotal > 0 && <p>{t('catalogo.notaTarifaAdulto')}</p>}
        {a.costo_aproximado && costoTotal > 0 && (
          <p>
            {t('catalogo.costoAproximado', { fecha: a.fecha_actualizacion })}
          </p>
        )}
        <p>{t('catalogo.fuente', { fuente: a.fuente })}</p>
      </footer>
    </article>
  );
}
