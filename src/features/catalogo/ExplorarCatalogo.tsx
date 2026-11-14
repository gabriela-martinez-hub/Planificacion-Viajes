// Vista de exploración del catálogo (T-09). Dos pestañas: Municipios y
// Atracciones, cada una con buscador, filtro por departamento y por estilo, y
// ficha de detalle al elegir una atracción. Mobile-first. Lee el catálogo con
// TanStack Query (solo lectura). La selección de destinos para armar un viaje
// es otra pantalla (planificador, T-13).
import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Camera,
  Compass,
  Map as MapIcon,
  MapPin,
  Star,
} from 'lucide-react';
import { t } from '@/i18n';
import { useMovimiento } from '@/lib/motion';
import { PaginaAnimada } from '@/features/shell/PaginaAnimada';
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
    <PaginaAnimada>
      <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ambar-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ambar-800">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          {t('nav.explorar')}
        </span>
        <h2 className="sello-titulo text-2xl">{t('catalogo.titulo')}</h2>
        <p className="text-sm text-tinta-500">{t('catalogo.subtitulo')}</p>
      </header>

      {/* Pestañas Municipios | Atracciones | Mapa */}
      <div
        className="segmentos"
        role="tablist"
        aria-label={t('catalogo.titulo')}
      >
        {(['municipios', 'atracciones', 'mapa'] as const).map((p) => {
          const Icono =
            p === 'municipios'
              ? Building2
              : p === 'atracciones'
                ? Camera
                : MapIcon;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={pestana === p}
              onClick={() => setPestana(p)}
              className={`segmento flex flex-1 items-center justify-center gap-1.5 ${pestana === p ? 'segmento-activo' : ''}`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {p === 'municipios'
                ? t('catalogo.pestanaMunicipios')
                : p === 'atracciones'
                  ? t('catalogo.pestanaAtracciones')
                  : t('catalogo.pestanaMapa')}
            </button>
          );
        })}
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
            className="campo"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="etiqueta-campo">
              {t('catalogo.filtroDepartamento')}
            </span>
            <select
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className="campo"
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
            <span className="etiqueta-campo">{t('catalogo.filtroEstilo')}</span>
            <select
              value={estilo}
              onChange={(e) => setEstilo(e.target.value)}
              className="campo"
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
        <p className="text-tinta-500" role="status">
          {t('comun.cargando')}
        </p>
      )}

      {error && (
        <p className="text-red-700" role="alert">
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
            <p className="text-tinta-500" role="status">
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
    </PaginaAnimada>
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
  const { propsContenedor, propsItem } = useMovimiento();
  if (municipios.length === 0) {
    return (
      <p className="text-tinta-500">{t('catalogo.municipioNoEncontrado')}</p>
    );
  }
  return (
    <>
      <p className="text-xs text-tinta-500">
        {t('catalogo.conteoMunicipios', { n: municipios.length })}
      </p>
      <motion.ul className="flex flex-col gap-3" {...propsContenedor}>
        {municipios.map((m) => (
          <motion.li key={m.id} className="tarjeta" {...propsItem}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-selva-100 text-selva-700">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="flex-1 font-display font-semibold text-tinta-900">
                {m.nombre}
              </h3>
              {m.es_pueblo_patrimonio && (
                <span className="pildora inline-flex items-center gap-1 bg-ambar-100 text-ambar-800">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  {t('catalogo.puebloPatrimonio')}
                </span>
              )}
            </div>
            {(() => {
              const lista = porMunicipio.get(m.id) ?? [];
              return lista.length === 0 ? (
                <p className="mt-2 pl-12 text-sm text-tinta-500">
                  {t('catalogo.sinAtracciones')}
                </p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {lista.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => alAbrirAtraccion(a)}
                        className="inline-flex items-center gap-1 rounded-full bg-selva-50 px-3 py-1 text-sm font-medium text-selva-700 transition-colors hover:bg-selva-100"
                      >
                        <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                        {a.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </motion.li>
        ))}
      </motion.ul>
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
  const { reducir, propsContenedor, propsItem } = useMovimiento();
  if (atracciones.length === 0) {
    return (
      <p className="text-tinta-500">{t('catalogo.atraccionNoEncontrada')}</p>
    );
  }
  return (
    <>
      <p className="text-xs text-tinta-500">
        {t('catalogo.conteoAtracciones', { n: atracciones.length })}
      </p>
      <motion.ul className="flex flex-col gap-2" {...propsContenedor}>
        {atracciones.map((a) => (
          <motion.li key={a.id} {...propsItem}>
            <motion.button
              type="button"
              onClick={() => alAbrirAtraccion(a)}
              whileHover={reducir ? undefined : { x: 4 }}
              className="flex w-full items-center gap-3 rounded-2xl border border-crema-oscuro bg-crema-claro p-3 text-left shadow-papel transition-colors hover:border-selva-300 hover:bg-selva-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ambar-100 text-ambar-700">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-tinta-900">
                  {a.nombre}
                </span>
                <span className="block truncate text-xs text-tinta-500">
                  {nombreMunicipio(a.municipio_id)} · {a.categoria}
                </span>
              </span>
            </motion.button>
          </motion.li>
        ))}
      </motion.ul>
    </>
  );
}
