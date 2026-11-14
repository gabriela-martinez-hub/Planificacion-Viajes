// Perfil del usuario como "álbum de estampas" (T-21, plan.md 6.4): cuadrícula
// de insignias coleccionables, mapa de municipios desbloqueados, progreso por
// departamento y por ruta, y la opción de eliminar la cuenta. Requiere sesión.

import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Coffee,
  Droplets,
  Landmark,
  Mountain,
  Sparkles,
  TreePalm,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { t, tTexto } from '@/i18n';
import { useMovimiento } from '@/lib/motion';
import { PaginaAnimada } from '@/features/shell/PaginaAnimada';
import { useAuth } from '@/features/auth/use-auth';
import {
  useDepartamentos,
  useMunicipios,
  useRutasTematicas,
  useRutaItems,
} from '@/features/catalogo/use-catalogo';
import { AnilloProgreso } from '@/features/shell/AnilloProgreso';
import { useCheckins, useInsigniasUsuario } from './use-checkins';
import {
  municipiosVisitados,
  progresoEje,
  progresoPorDepartamento,
  progresoPorRuta,
  type Progreso,
} from '@/domain/insignias/progreso';
import { ModalEliminarCuenta } from '@/features/privacidad/ModalEliminarCuenta';

// Mapa diferido: Leaflet queda en su propio chunk, igual que en el catálogo.
const MapaPerfil = lazy(() =>
  import('./MapaPerfil').then((m) => ({ default: m.MapaPerfil })),
);

// Iconos para las estampas. Elegimos uno de forma determinista a partir del id
// de la insignia para que cada estampa tenga siempre el mismo icono (son
// decorativos; no sustituyen al texto).
const ICONOS_ESTAMPA: LucideIcon[] = [
  Coffee,
  Mountain,
  Droplets,
  Landmark,
  TreePalm,
  Sparkles,
  Award,
  Trophy,
];

function iconoParaInsignia(id: string): LucideIcon {
  let suma = 0;
  for (let i = 0; i < id.length; i++) suma += id.charCodeAt(i);
  return ICONOS_ESTAMPA[suma % ICONOS_ESTAMPA.length];
}

export function Perfil() {
  const { usuario } = useAuth();
  const habilitado = usuario !== null;

  const departamentos = useDepartamentos();
  const municipios = useMunicipios();
  const rutas = useRutasTematicas();
  const rutaItems = useRutaItems();
  const checkins = useCheckins(habilitado);
  const insignias = useInsigniasUsuario(habilitado);

  const [confirmando, setConfirmando] = useState(false);

  const datos = useMemo(() => {
    const cks = checkins.data ?? [];
    const munis = municipios.data ?? [];
    return {
      visitados: municipiosVisitados(cks),
      eje: progresoEje(munis, cks),
      porDepto: progresoPorDepartamento(departamentos.data ?? [], munis, cks),
      porRuta: progresoPorRuta(rutas.data ?? [], rutaItems.data ?? [], cks),
    };
  }, [
    checkins.data,
    municipios.data,
    departamentos.data,
    rutas.data,
    rutaItems.data,
  ]);

  if (!usuario) {
    return (
      <p className="tarjeta text-tinta-600">{t('perfil.iniciaParaVerPerfil')}</p>
    );
  }

  const insigniasObtenidas = insignias.data ?? [];

  return (
    <PaginaAnimada>
      <section className="flex flex-col gap-6">
      {/* Portada del álbum con el progreso general */}
      <div className="flex items-center gap-4 rounded-sello border border-crema-oscuro bg-selva-700 p-5 text-crema-claro shadow-papel">
        <AnilloProgreso fraccion={datos.eje.total === 0 ? 0 : datos.eje.visitados / datos.eje.total} tamano={64}>
          <span className="text-sm text-crema-claro">
            {datos.eje.visitados}
          </span>
        </AnilloProgreso>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-semibold">
            {t('perfil.titulo')}
          </h2>
          <p className="text-sm text-crema-claro/80">{t('perfil.subtitulo')}</p>
        </div>
      </div>

      {/* Álbum de estampas */}
      <AlbumEstampas
        insignias={insigniasObtenidas.map((iu) => ({
          id: iu.insignia_id,
          verificada: iu.verificada,
        }))}
      />

      {/* Mapa de municipios desbloqueados */}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-semibold text-selva-800">
          {t('perfil.mapaTitulo')}
        </h3>
        {municipios.data && (
          <Suspense
            fallback={
              <p className="text-sm text-tinta-500">
                {t('perfil.cargandoMapa')}
              </p>
            }
          >
            <MapaPerfil
              municipios={municipios.data}
              visitados={datos.visitados}
            />
          </Suspense>
        )}
      </div>

      {/* Progreso por departamento */}
      <div className="tarjeta flex flex-col gap-3">
        <h3 className="font-display text-lg font-semibold text-selva-800">
          {t('perfil.progresoDepartamentos')}
        </h3>
        <ul className="flex flex-col gap-3">
          {datos.porDepto.map(({ departamento, progreso }) => (
            <li key={departamento.id}>
              <BarraProgreso
                etiqueta={departamento.nombre}
                progreso={progreso}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Progreso por ruta */}
      <div className="tarjeta flex flex-col gap-3">
        <h3 className="font-display text-lg font-semibold text-selva-800">
          {t('perfil.progresoRutas')}
        </h3>
        <ul className="flex flex-col gap-3">
          {datos.porRuta.map(({ ruta, progreso }) => (
            <li key={ruta.id}>
              <BarraProgreso
                etiqueta={tTexto(ruta.clave_texto)}
                progreso={progreso}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Eliminar cuenta */}
      <div className="border-t border-tinta-200 pt-4">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          {t('perfil.eliminarCuenta')}
        </button>
      </div>

      {confirmando && (
        <ModalEliminarCuenta
          alEliminar={() => setConfirmando(false)}
          alCancelar={() => setConfirmando(false)}
        />
      )}
      </section>
    </PaginaAnimada>
  );
}

/** Cuadrícula de estampas coleccionables con entrada escalonada. */
function AlbumEstampas({
  insignias,
}: {
  insignias: { id: string; verificada: boolean }[];
}) {
  const { reducir, propsContenedor, propsItem } = useMovimiento();

  return (
    <div className="tarjeta flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-selva-800">
          {t('perfil.albumTitulo')}
        </h3>
        <span className="pildora bg-ambar-100 text-ambar-800">
          {insignias.length}
        </span>
      </div>

      {insignias.length === 0 ? (
        <p className="text-sm text-tinta-500">{t('perfil.sinInsignias')}</p>
      ) : (
        <motion.ul
          className="grid grid-cols-3 gap-3 sm:grid-cols-4"
          {...propsContenedor}
        >
          {insignias.map((iu) => {
            const Icono = iconoParaInsignia(iu.id);
            return (
              <motion.li
                key={iu.id}
                {...propsItem}
                whileHover={reducir ? undefined : { scale: 1.06, rotate: -2 }}
                className="estampa estampa-desbloqueada"
                title={`${iu.id} · ${
                  iu.verificada
                    ? t('insignias.verificada')
                    : t('insignias.noVerificada')
                }`}
              >
                <Icono className="h-7 w-7 text-ambar-300" aria-hidden="true" />
                <span className="line-clamp-2 text-[10px] font-semibold leading-tight">
                  {iu.id}
                </span>
                {iu.verificada && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ambar-400 text-tinta-900">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                  </span>
                )}
                <span className="sr-only">
                  {iu.verificada
                    ? t('insignias.verificada')
                    : t('insignias.noVerificada')}
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}

/** Barra de progreso accesible (visitados de total). */
function BarraProgreso({
  etiqueta,
  progreso,
}: {
  etiqueta?: string;
  progreso: Progreso;
}) {
  const reducir = useMovimiento().reducir;
  const pct =
    progreso.total === 0
      ? 0
      : Math.round((progreso.visitados / progreso.total) * 100);
  const texto = t('perfil.progreso', {
    visitados: progreso.visitados,
    total: progreso.total,
  });
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-tinta-700">{etiqueta ?? texto}</span>
        <span className="text-tinta-500">{texto}</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-tinta-200"
        role="progressbar"
        aria-valuenow={progreso.visitados}
        aria-valuemin={0}
        aria-valuemax={progreso.total}
        aria-label={etiqueta ?? t('perfil.municipiosVisitados')}
      >
        <motion.div
          className={progreso.completo ? 'h-full bg-selva-600' : 'h-full bg-selva-400'}
          initial={reducir ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={reducir ? { duration: 0 } : { duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
