// Panel del modo "viaje soñado" (T-16, plan.md 6.2): meta de ahorro, aportes y
// barra de progreso. Vive en el detalle de un viaje guardado (necesita viaje_id
// para persistir meta y aportes en Supabase; la cuota se calcula, no se guarda).

import { useMemo, useState } from 'react';
import { t } from '@/i18n';
import { formatearCOP } from '@/features/catalogo/formato';
import { calcularAhorro, type FrecuenciaAhorro } from '@/domain/presupuesto';
import { hoyBogota } from './hoy';
import {
  useMeta,
  useAportes,
  useGuardarMeta,
  useRegistrarAporte,
} from './use-metas-ahorro';

interface Props {
  viajeId: string;
  /** Fecha de inicio del viaje 'AAAA-MM-DD' (para calcular los periodos). */
  fechaInicio: string;
  /** Total estimado del viaje, para prellenar el objetivo. */
  totalSugeridoCop: number;
}

export function PanelMetaAhorro({
  viajeId,
  fechaInicio,
  totalSugeridoCop,
}: Props) {
  const meta = useMeta(viajeId);
  const aportes = useAportes(viajeId);
  const guardarMeta = useGuardarMeta();
  const registrarAporte = useRegistrarAporte();

  const hoy = useMemo(() => hoyBogota(), []);

  if (meta.isLoading || aportes.isLoading) {
    return (
      <p className="text-tinta-500" role="status">
        {t('comun.cargando')}
      </p>
    );
  }

  if (!meta.data) {
    return (
      <FormularioMeta
        sugerido={totalSugeridoCop}
        guardando={guardarMeta.isPending}
        error={guardarMeta.isError}
        onGuardar={(objetivo, frecuencia) =>
          guardarMeta.mutate({
            viaje_id: viajeId,
            monto_objetivo_cop: objetivo,
            frecuencia,
          })
        }
      />
    );
  }

  const resultado = calcularAhorro({
    metaCop: meta.data.monto_objetivo_cop,
    frecuencia: meta.data.frecuencia,
    fechaInicio,
    hoy,
    aportes: aportes.data ?? [],
  });

  return (
    <section className="flex flex-col gap-3 tarjeta">
      <h3 className="text-lg font-bold text-selva-800">
        {t('presupuesto.meta.titulo')}
      </h3>

      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-tinta-600">
            {t('presupuesto.meta.objetivo')}
          </span>
          <span className="font-medium text-tinta-900">
            {formatearCOP(meta.data.monto_objetivo_cop)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-tinta-600">
            {t('presupuesto.meta.ahorrado')}
          </span>
          <span className="text-selva-800">
            {formatearCOP(resultado.ahorrado)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-tinta-600">
            {t('presupuesto.meta.restante')}
          </span>
          <span className="text-tinta-900">
            {formatearCOP(resultado.restante)}
          </span>
        </div>
      </div>

      <BarraProgreso progreso={resultado.progreso} />

      {resultado.estado === 'cumplida' && (
        <p className="text-sm font-medium text-selva-700" role="status">
          {t('presupuesto.meta.cumplida')}
        </p>
      )}
      {resultado.estado === 'vencida' && (
        <p className="text-sm text-ambar-800" role="status">
          {t('presupuesto.meta.vencida')}
        </p>
      )}
      {resultado.estado === 'activa' && (
        <p className="text-sm text-tinta-700">
          {t('presupuesto.meta.cuota')}:{' '}
          <span className="font-medium">
            {t('presupuesto.meta.cuotaDetalle', {
              cuota: formatearCOP(resultado.cuota),
              frecuencia:
                meta.data.frecuencia === 'semanal'
                  ? t('presupuesto.meta.semanal').toLowerCase()
                  : t('presupuesto.meta.mensual').toLowerCase(),
            })}
          </span>
        </p>
      )}

      <FormularioAporte
        hoy={hoy}
        guardando={registrarAporte.isPending}
        exito={registrarAporte.isSuccess}
        error={registrarAporte.isError}
        onAportar={(fecha, monto) =>
          registrarAporte.mutate({ viajeId, fecha, montoCop: monto })
        }
      />
    </section>
  );
}

function BarraProgreso({ progreso }: { progreso: number }) {
  const pct = Math.round(progreso * 100);
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-tinta-200"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-selva-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface FormMetaProps {
  sugerido: number;
  guardando: boolean;
  error: boolean;
  onGuardar: (objetivo: number, frecuencia: FrecuenciaAhorro) => void;
}

function FormularioMeta({
  sugerido,
  guardando,
  error,
  onGuardar,
}: FormMetaProps) {
  const [objetivo, setObjetivo] = useState(String(sugerido));
  const [frecuencia, setFrecuencia] = useState<FrecuenciaAhorro>('mensual');

  return (
    <section className="flex flex-col gap-3 tarjeta">
      <h3 className="text-lg font-bold text-selva-800">
        {t('presupuesto.meta.titulo')}
      </h3>
      <p className="text-sm text-tinta-500">{t('presupuesto.meta.sinMeta')}</p>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-tinta-600">{t('presupuesto.meta.objetivo')}</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          className="campo"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-tinta-600">
          {t('presupuesto.meta.frecuencia')}
        </span>
        <select
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value as FrecuenciaAhorro)}
          className="campo"
        >
          <option value="mensual">{t('presupuesto.meta.mensual')}</option>
          <option value="semanal">{t('presupuesto.meta.semanal')}</option>
        </select>
      </label>

      <button
        type="button"
        disabled={guardando || Number(objetivo) <= 0}
        onClick={() => onGuardar(Math.floor(Number(objetivo)), frecuencia)}
        className="self-start boton-primario text-sm disabled:opacity-50"
      >
        {t('presupuesto.meta.guardar')}
      </button>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {t('presupuesto.meta.errorMeta')}
        </p>
      )}
    </section>
  );
}

interface FormAporteProps {
  hoy: string;
  guardando: boolean;
  exito: boolean;
  error: boolean;
  onAportar: (fecha: string, monto: number) => void;
}

function FormularioAporte({
  hoy,
  guardando,
  exito,
  error,
  onAportar,
}: FormAporteProps) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoy);

  const valido = Number(monto) > 0 && fecha !== '';

  return (
    <div className="flex flex-col gap-2 border-t border-tinta-200 pt-3">
      <span className="text-sm font-medium text-tinta-700">
        {t('presupuesto.meta.aporte')}
      </span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="campo flex-1 text-sm"
          aria-label={t('presupuesto.meta.aporte')}
        />
        <input
          type="date"
          max={hoy}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="campo text-sm"
        />
      </div>
      <button
        type="button"
        disabled={guardando || !valido}
        onClick={() => {
          onAportar(fecha, Math.floor(Number(monto)));
          setMonto('');
        }}
        className="self-start rounded-md border border-selva-600 px-3 py-1 text-sm font-medium text-selva-700 hover:bg-selva-50 disabled:opacity-50"
      >
        {t('presupuesto.meta.registrarAporte')}
      </button>
      {exito && (
        <p className="text-sm text-selva-700" role="status">
          {t('presupuesto.meta.aporteRegistrado')}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {t('presupuesto.meta.errorAporte')}
        </p>
      )}
    </div>
  );
}
