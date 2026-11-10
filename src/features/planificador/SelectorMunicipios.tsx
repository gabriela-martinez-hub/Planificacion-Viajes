// Selector de municipios para el viaje (T-13). Buscador que ignora tildes más
// una lista de casillas. Es el combobox "escribir o desplegar" que en T-09 se
// aplazó al planificador. Accesible por teclado (casillas y foco nativos).
import { useMemo, useState } from 'react';
import { t } from '@/i18n';
import type { Municipio } from '@/domain/catalogo/esquemas';

/** Normaliza para buscar sin tildes ni mayúsculas. */
function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

interface Props {
  municipios: Municipio[];
  seleccionados: string[];
  alCambiar: (ids: string[]) => void;
}

export function SelectorMunicipios({
  municipios,
  seleccionados,
  alCambiar,
}: Props) {
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (q === '') return municipios;
    return municipios.filter((m) => normalizar(m.nombre).includes(q));
  }, [municipios, busqueda]);

  const alternar = (id: string) => {
    if (seleccionados.includes(id)) {
      alCambiar(seleccionados.filter((x) => x !== id));
    } else {
      alCambiar([...seleccionados, id]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder={t('catalogo.buscarMunicipio')}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        aria-label={t('planificador.municipios')}
      />
      {seleccionados.length > 0 && (
        <p className="text-xs text-slate-500">
          {t('planificador.municipiosElegidos', { n: seleccionados.length })}
        </p>
      )}
      <ul className="max-h-48 overflow-y-auto rounded-md border border-slate-200">
        {visibles.length === 0 ? (
          <li className="px-3 py-2 text-sm text-slate-400">
            {t('catalogo.municipioNoEncontrado')}
          </li>
        ) : (
          visibles.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(m.id)}
                  onChange={() => alternar(m.id)}
                  className="h-4 w-4"
                />
                <span>{m.nombre}</span>
                {m.es_pueblo_patrimonio && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    {t('catalogo.puebloPatrimonio')}
                  </span>
                )}
              </label>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
