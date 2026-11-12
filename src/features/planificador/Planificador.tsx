// Planificador de viajes (T-13): formulario del viaje, generación del
// itinerario con el dominio (T-11) y vista día por día editable. Todo en
// memoria; guardar es T-14, el presupuesto con ajuste es T-15 y el clima real
// T-17/T-18.
import { useEffect, useMemo, useState } from 'react';
import { t } from '@/i18n';
import { ESTILOS } from '@/domain/catalogo/esquemas';
import type { Estilo } from '@/domain/itinerario';
import { generarItinerario } from '@/domain/itinerario';
import type { Itinerario } from '@/domain/itinerario';
import {
  formularioViajeSchema,
  NIVELES,
  type FormularioViaje,
} from '@/domain/viaje/esquemas';
import {
  useMunicipios,
  useAtracciones,
  useOrigenesExternos,
  useRutasBus,
  useTarifas,
} from '@/features/catalogo/use-catalogo';
import { armarEntrada } from './armar-entrada';
import {
  subirItem,
  bajarItem,
  alternarFijado,
  ordenDestinos,
  moverDestino,
} from './editar-itinerario';
import { serializarViaje } from './persistir';
import { PanelPresupuesto } from './PanelPresupuesto';
import { useGuardarViaje } from './use-viajes';
import {
  guardarPendiente,
  leerPendiente,
  borrarPendiente,
} from './viaje-pendiente';
import { useAuth } from '@/features/auth/use-auth';
import { hoyBogota } from './hoy';
import { SelectorMunicipios } from './SelectorMunicipios';
import { VistaItinerario } from './VistaItinerario';

type Nivel = (typeof NIVELES)[number];

export function Planificador() {
  const municipios = useMunicipios();
  const atracciones = useAtracciones();
  const origenes = useOrigenesExternos();
  const rutas = useRutasBus();
  const tarifas = useTarifas();

  const { usuario, iniciarSesionGoogle } = useAuth();
  const guardar = useGuardarViaje();

  const cargando =
    municipios.isLoading ||
    atracciones.isLoading ||
    origenes.isLoading ||
    rutas.isLoading ||
    tarifas.isLoading;
  const error =
    municipios.error ??
    atracciones.error ??
    origenes.error ??
    rutas.error ??
    tarifas.error;

  // Estado del formulario.
  const [titulo, setTitulo] = useState('');
  const [origenNodoId, setOrigen] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [incluyeRegreso, setIncluyeRegreso] = useState(true);
  const [viajeros, setViajeros] = useState(2);
  const [nivel, setNivel] = useState<Nivel>('economico');
  const [estilos, setEstilos] = useState<Estilo[]>([]);
  const [municipiosElegidos, setMunicipios] = useState<string[]>([]);

  const [errores, setErrores] = useState<string[]>([]);
  const [itinerario, setItinerario] = useState<Itinerario | null>(null);
  // Último formulario válido y orden de destinos elegido, para regenerar al
  // reordenar los destinos sin volver a validar el formulario.
  const [formValido, setFormValido] = useState<FormularioViaje | null>(null);
  const [ordenMunicipios, setOrdenMunicipios] = useState<string[] | null>(null);

  const hoy = useMemo(() => hoyBogota(), []);
  const todosEstilos = estilos.length === ESTILOS.length;

  const alternarTodosEstilos = () => {
    setEstilos(todosEstilos ? [] : [...ESTILOS]);
  };

  const nombreMunicipio = useMemo(() => {
    const mapa = new Map(
      [...(municipios.data ?? []), ...(origenes.data ?? [])].map((n) => [
        n.id,
        n.nombre,
      ]),
    );
    return (id: string) => mapa.get(id) ?? id;
  }, [municipios.data, origenes.data]);

  const alternarEstilo = (e: Estilo) => {
    setEstilos((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  };

  const datosCatalogo = () => ({
    municipios: municipios.data ?? [],
    origenesExternos: origenes.data ?? [],
    atracciones: atracciones.data ?? [],
    rutasBus: rutas.data ?? [],
    tarifas: tarifas.data ?? [],
  });

  /** Genera (o regenera) el itinerario con un orden de destinos opcional. */
  const generar = (form: FormularioViaje, orden: string[] | null) => {
    const entrada = armarEntrada(form, datosCatalogo());
    const resultado = generarItinerario({
      ...entrada,
      ordenMunicipios: orden ?? undefined,
    });
    if (!resultado.ok) {
      setErrores([resultado.mensaje]);
      setItinerario(null);
      return;
    }
    setErrores([]);
    setItinerario(resultado.itinerario);
    setFormValido(form);
    setOrdenMunicipios(orden);
  };

  const alGenerar = () => {
    setErrores([]);
    setItinerario(null);

    const bruto: FormularioViaje = {
      titulo,
      origenNodoId,
      fechaInicio,
      fechaFin,
      incluyeRegreso,
      viajeros,
      estilos,
      nivel,
      municipiosElegidos,
      atraccionesObligatorias: [],
      limiteJornadaMin: 540,
      modoPresupuesto: 'fijo',
      hoy,
    };

    const validado = formularioViajeSchema.safeParse(bruto);
    if (!validado.success) {
      setErrores(validado.error.issues.map((i) => i.message));
      return;
    }

    // Generación inicial: sin orden manual (el generador ordena por cercanía).
    generar(validado.data, null);
  };

  /** Reordena los destinos y regenera. Marca el orden como manual (no óptimo). */
  const alMoverDestino = (
    municipioId: string,
    direccion: 'arriba' | 'abajo',
  ) => {
    if (!formValido || !itinerario) return;
    const ordenActual = ordenMunicipios ?? ordenDestinos(itinerario);
    const nuevoOrden = moverDestino(ordenActual, municipioId, direccion);
    generar(formValido, nuevoOrden);
  };

  const alGuardar = () => {
    if (!formValido || !itinerario) return;
    guardar.mutate(serializarViaje(formValido, itinerario), {
      onSuccess: () => {
        borrarPendiente();
      },
    });
  };

  /** Guarda el itinerario en sessionStorage e inicia sesión. El login recarga
   *  la página; al volver, el useEffect de abajo lo restaura. */
  const alIniciarParaGuardar = () => {
    if (formValido && itinerario) {
      guardarPendiente({ formulario: formValido, itinerario });
    }
    void iniciarSesionGoogle('/planificar');
  };

  // Al volver del login con sesión, restaura el itinerario que se estaba
  // preparando (si lo hay) para poder guardarlo sin regenerarlo.
  const [restaurado, setRestaurado] = useState(false);
  useEffect(() => {
    if (!usuario || itinerario) return;
    const pendiente = leerPendiente();
    if (!pendiente) return;
    setFormValido(pendiente.formulario);
    setItinerario(pendiente.itinerario);
    setOrdenMunicipios(null);
    setRestaurado(true);
  }, [usuario, itinerario]);

  // Municipios del catálogo + orígenes externos como posibles puntos de partida.
  const opcionesOrigen = useMemo(() => {
    const ext = (origenes.data ?? []).map((o) => ({
      id: o.id,
      nombre: o.nombre,
    }));
    const muni = (municipios.data ?? []).map((m) => ({
      id: m.id,
      nombre: m.nombre,
    }));
    return [...ext, ...muni];
  }, [origenes.data, municipios.data]);

  if (cargando) {
    return (
      <p className="text-slate-500" role="status">
        {t('comun.cargando')}
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-red-600" role="alert">
        {t('comun.errorGenerico')}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-bold text-emerald-800">
          {t('planificador.titulo')}
        </h2>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          alGenerar();
        }}
      >
        <Campo etiqueta={t('planificador.tituloViaje')}>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </Campo>

        <Campo etiqueta={t('planificador.origen')}>
          <select
            value={origenNodoId}
            onChange={(e) => setOrigen(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">{t('planificador.elige')}</option>
            {opcionesOrigen.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Campo etiqueta={t('planificador.fechaInicio')} className="flex-1">
            <input
              type="date"
              value={fechaInicio}
              min={hoy}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </Campo>
          <Campo etiqueta={t('planificador.fechaFin')} className="flex-1">
            <input
              type="date"
              value={fechaFin}
              min={fechaInicio || hoy}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </Campo>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Campo etiqueta={t('planificador.viajeros')} className="flex-1">
            <input
              type="number"
              min={1}
              value={viajeros}
              onChange={(e) => setViajeros(Number(e.target.value))}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </Campo>
          <Campo etiqueta={t('planificador.nivelViaje')} className="flex-1">
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value as Nivel)}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              {NIVELES.map((n) => (
                <option key={n} value={n}>
                  {t(`planificador.nivel.${n}`)}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-slate-600">
            {t('planificador.estilos')}
          </legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={alternarTodosEstilos}
              aria-pressed={todosEstilos}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                todosEstilos
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              {t('planificador.estilosTodos')}
            </button>
            {ESTILOS.map((e) => (
              <label
                key={e}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                  estilos.includes(e)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={estilos.includes(e)}
                  onChange={() => alternarEstilo(e)}
                  className="sr-only"
                />
                {t(`catalogo.estilos.${e}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <Campo etiqueta={t('planificador.municipios')}>
          <SelectorMunicipios
            municipios={municipios.data ?? []}
            seleccionados={municipiosElegidos}
            alCambiar={setMunicipios}
          />
        </Campo>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={incluyeRegreso}
            onChange={(e) => setIncluyeRegreso(e.target.checked)}
            className="h-4 w-4"
          />
          {t('planificador.incluyeRegreso')}
        </label>

        {errores.length > 0 && (
          <ul
            className="rounded-md bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {errores.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
        >
          {t('planificador.generar')}
        </button>
      </form>

      {itinerario && (
        <>
          <div className="flex flex-col gap-2">
            {usuario ? (
              <>
                {restaurado && !guardar.isSuccess && (
                  <p className="text-sm text-emerald-700" role="status">
                    {t('planificador.viajeRestaurado')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={alGuardar}
                  disabled={guardar.isPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {guardar.isPending
                    ? t('comun.cargando')
                    : t('planificador.guardarViaje')}
                </button>
                {guardar.isSuccess && (
                  <p className="text-sm text-emerald-700" role="status">
                    {t('planificador.viajeGuardado')}
                  </p>
                )}
                {guardar.isError && (
                  <p className="text-sm text-red-600" role="alert">
                    {t('planificador.errorGuardar')}
                    {guardar.error instanceof Error
                      ? ` (${guardar.error.message})`
                      : ''}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">
                {t('planificador.iniciaParaGuardar')}{' '}
                <button
                  type="button"
                  onClick={alIniciarParaGuardar}
                  className="text-emerald-700 underline hover:text-emerald-800"
                >
                  {t('auth.iniciarSesion')}
                </button>
              </p>
            )}
          </div>

          {formValido && (
            <PanelPresupuesto
              itinerario={itinerario}
              entrada={armarEntrada(formValido, datosCatalogo(), [], {
                ordenMunicipios: ordenMunicipios ?? undefined,
              })}
              alAjustar={(nuevo) => setItinerario(nuevo)}
            />
          )}

          <VistaItinerario
            itinerario={itinerario}
            nombreMunicipio={nombreMunicipio}
            ordenManual={ordenMunicipios !== null}
            alSubir={(dia, orden) =>
              setItinerario((it) => (it ? subirItem(it, dia, orden) : it))
            }
            alBajar={(dia, orden) =>
              setItinerario((it) => (it ? bajarItem(it, dia, orden) : it))
            }
            alFijar={(dia, orden) =>
              setItinerario((it) => (it ? alternarFijado(it, dia, orden) : it))
            }
            alMoverDestino={alMoverDestino}
          />
        </>
      )}
    </section>
  );
}

interface CampoProps {
  etiqueta: string;
  className?: string;
  children: React.ReactNode;
}

function Campo({ etiqueta, className, children }: CampoProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ''}`}>
      <span className="text-slate-600">{etiqueta}</span>
      {children}
    </label>
  );
}
