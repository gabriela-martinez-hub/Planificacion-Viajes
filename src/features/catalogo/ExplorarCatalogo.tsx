// Vista de exploración del catálogo (T-09). Dos pestañas: Municipios y
// Atracciones, cada una con buscador, filtro por departamento y por estilo, y
// ficha de detalle al elegir una atracción. Mobile-first. Lee el catálogo con
// TanStack Query (solo lectura). La selección de destinos para armar un viaje
// es otra pantalla (planificador, T-13).
import { lazy, Suspense, useMemo, useState } from 'react';
import { t } from '@/i18n';
import { ESTILOS } from '@/domain/catalogo/esquemas';
import type { Atraccion, Municipio } from '@/domain/catalogo/esquemas';
import {
  useDepartamentos,
  useMunicipios,
  useAtracciones,
} from './use-catalogo';
import { FichaAtraccion } from './FichaAtraccion';
import {
  atraccionesVisiblesPorMunicipio,
  atraccionesFiltradas,
  municipiosFiltrados,
} from './filtrar';

// El mapa (Leaflet) es pesado; se carga solo al abrir la pestaña Mapa para no
// engordar el arranque en móvil.
const MapaCatalogo = lazy(() =>
  import('./MapaCatalogo').then((m) => ({ default: m.MapaCatalogo })),
);

type Pestana = 'municipios' | 'atracciones' | 'mapa';

export function ExplorarCatalogo() {
  const departamentos = useDepartamentos();
  const municipios = useMunicipios();
  const atracciones = useAtracciones();

  const [pestana, setPestana] = useState<Pestana>('municipios');
  const [busqueda, setBusqueda] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [estilo, setEstilo] = useState('');
  const [atraccionActiva, setAtraccionActiva] = useState<Atraccion | null>(
    null,
  );

  const cargando =
    departamentos.isLoading || municipios.isLoading || atracciones.isLoading;
  const error = departamentos.error ?? municipios.error ?? atracciones.error;

  const porMunicipio = useMemo(
    () => atraccionesVisiblesPorMunicipio(atracciones.data ?? [], estilo),
    [atracciones.data, estilo],
  );

  const listaMunicipios = useMemo(
    () =>
      municipiosFiltrados(municipios.data ?? [], porMunicipio, {
        busqueda,
        departamento,
        estilo,
      }),
    [municipios.data, porMunicipio, busqueda, departamento, estilo],
  );

  const listaAtracciones = useMemo(
    () =>
      atraccionesFiltradas(atracciones.data ?? [], municipios.data ?? [], {
        busqueda,
        departamento,
        estilo,
      }),
    [atracciones.data, municipios.data, busqueda, departamento, estilo],
  );

  const nombreMunicipio = (id: string) =>
    municipios.data?.find((m) => m.id === id)?.nombre ?? id;

  if (atraccionActiva) {
    return (
      <FichaAtraccion
        atraccion={atraccionActiva}
        nombreMunicipio={nombreMunicipio(atraccionActiva.municipio_id)}
        alVolver={() => setAtraccionActiva(null)}
      />
    );
  }

  const placeholderBusqueda =
    pestana === 'atracciones'
      ? t('catalogo.buscarAtraccion')
      : t('catalogo.buscarMunicipio');

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-emerald-800">
          {t('catalogo.titulo')}
        </h2>
        <p className="text-sm text-slate-500">{t('catalogo.subtitulo')}</p>
      </header>

      {/* Pestañas Municipios | Atracciones | Mapa */}
      <div
        className="flex gap-1 rounded-lg bg-slate-100 p-1"
        role="tablist"
        aria-label={t('catalogo.titulo')}
      >
        {(['municipios', 'atracciones', 'mapa'] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              pestana === p
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {p === 'municipios'
              ? t('catalogo.pestanaMunicipios')
              : p === 'atracciones'
                ? t('catalogo.pestanaAtracciones')
                : t('catalogo.pestanaMapa')}
          </button>
        ))}
      </div>

      {/* Filtros comunes a las dos pestañas */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="sr-only">{placeholderBusqueda}</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={placeholderBusqueda}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-slate-600">
              {t('catalogo.filtroDepartamento')}
            </span>
            <select
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">{t('catalogo.todos')}</option>
              {(departamentos.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-slate-600">{t('catalogo.filtroEstilo')}</span>
            <select
              value={estilo}
              onChange={(e) => setEstilo(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">{t('catalogo.todos')}</option>
              {ESTILOS.map((e) => (
                <option key={e} value={e}>
                  {t(`catalogo.estilos.${e}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {cargando && (
        <p className="text-slate-500" role="status">
          {t('comun.cargando')}
        </p>
      )}

      {error && (
        <p className="text-red-600" role="alert">
          {t('comun.errorGenerico')}
        </p>
      )}

      {!cargando && !error && pestana === 'municipios' && (
        <ListaMunicipios
          municipios={listaMunicipios}
          porMunicipio={porMunicipio}
          alAbrirAtraccion={setAtraccionActiva}
        />
      )}

      {!cargando && !error && pestana === 'atracciones' && (
        <ListaAtracciones
          atracciones={listaAtracciones}
          nombreMunicipio={nombreMunicipio}
          alAbrirAtraccion={setAtraccionActiva}
        />
      )}

      {!cargando && !error && pestana === 'mapa' && (
        <Suspense
          fallback={
            <p className="text-slate-500" role="status">
              {t('comun.cargando')}
            </p>
          }
        >
          <MapaCatalogo
            municipios={listaMunicipios}
            atraccionesPorMunicipio={porMunicipio}
            alAbrirAtraccion={setAtraccionActiva}
          />
        </Suspense>
      )}
    </section>
  );
}

// ------------------------------------------------------------ Municipios

interface ListaMunicipiosProps {
  municipios: Municipio[];
  porMunicipio: Map<string, Atraccion[]>;
  alAbrirAtraccion: (a: Atraccion) => void;
}

function ListaMunicipios({
  municipios,
  porMunicipio,
  alAbrirAtraccion,
}: ListaMunicipiosProps) {
  if (municipios.length === 0) {
    return (
      <p className="text-slate-500">{t('catalogo.municipioNoEncontrado')}</p>
    );
  }
  return (
    <>
      <p className="text-xs text-slate-400">
        {t('catalogo.conteoMunicipios', { n: municipios.length })}
      </p>
      <ul className="flex flex-col gap-3">
        {municipios.map((m) => (
          <li key={m.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-800">{m.nombre}</h3>
              {m.es_pueblo_patrimonio && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {t('catalogo.puebloPatrimonio')}
                </span>
              )}
            </div>
            {(() => {
              const lista = porMunicipio.get(m.id) ?? [];
              return lista.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  {t('catalogo.sinAtracciones')}
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1">
                  {lista.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => alAbrirAtraccion(a)}
                        className="w-full rounded px-2 py-1 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                      >
                        {a.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </li>
        ))}
      </ul>
    </>
  );
}

// ------------------------------------------------------------ Atracciones

interface ListaAtraccionesProps {
  atracciones: Atraccion[];
  nombreMunicipio: (id: string) => string;
  alAbrirAtraccion: (a: Atraccion) => void;
}

function ListaAtracciones({
  atracciones,
  nombreMunicipio,
  alAbrirAtraccion,
}: ListaAtraccionesProps) {
  if (atracciones.length === 0) {
    return (
      <p className="text-slate-500">{t('catalogo.atraccionNoEncontrada')}</p>
    );
  }
  return (
    <>
      <p className="text-xs text-slate-400">
        {t('catalogo.conteoAtracciones', { n: atracciones.length })}
      </p>
      <ul className="flex flex-col gap-2">
        {atracciones.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => alAbrirAtraccion(a)}
              className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span className="block font-medium text-slate-800">
                {a.nombre}
              </span>
              <span className="block text-xs text-slate-500">
                {nombreMunicipio(a.municipio_id)} · {a.categoria}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
