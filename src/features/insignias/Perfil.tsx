// Perfil del usuario (T-21, plan.md 6.4): mapa de municipios desbloqueados,
// progreso por departamento y por ruta, insignias obtenidas y la opción de
// eliminar la cuenta y los datos. Requiere sesión.

import { lazy, Suspense, useMemo, useState } from 'react';
import { t, tTexto } from '@/i18n';
import { useAuth } from '@/features/auth/use-auth';
import {
  useDepartamentos,
  useMunicipios,
  useRutasTematicas,
  useRutaItems,
} from '@/features/catalogo/use-catalogo';
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
    return <p className="text-slate-500">{t('perfil.iniciaParaVerPerfil')}</p>;
  }

  const insigniasObtenidas = insignias.data ?? [];

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-emerald-800">
        {t('perfil.titulo')}
      </h2>

      {/* Resumen del Eje Cafetero */}
      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800">
          {t('perfil.municipiosVisitados')}
        </h3>
        <BarraProgreso progreso={datos.eje} />
      </div>

      {/* Mapa de municipios desbloqueados */}
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-800">
          {t('perfil.mapaTitulo')}
        </h3>
        {municipios.data && (
          <Suspense
            fallback={
              <p className="text-sm text-slate-500">
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
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-800">
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
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-800">
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

      {/* Insignias obtenidas */}
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-800">
          {t('perfil.insigniasTitulo')}
        </h3>
        {insigniasObtenidas.length === 0 ? (
          <p className="text-sm text-slate-500">{t('perfil.sinInsignias')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {insigniasObtenidas.map((iu) => (
              <li
                key={iu.insignia_id}
                className={`rounded-full px-3 py-1 text-xs ${
                  iu.verificada
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {iu.insignia_id}
                {' · '}
                {iu.verificada
                  ? t('insignias.verificada')
                  : t('insignias.noVerificada')}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Eliminar cuenta */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
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
        <span className="text-slate-700">{etiqueta ?? texto}</span>
        <span className="text-slate-500">{texto}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={progreso.visitados}
        aria-valuemin={0}
        aria-valuemax={progreso.total}
        aria-label={etiqueta ?? t('perfil.municipiosVisitados')}
      >
        <div
          className={
            progreso.completo
              ? 'h-full bg-emerald-600'
              : 'h-full bg-emerald-400'
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
