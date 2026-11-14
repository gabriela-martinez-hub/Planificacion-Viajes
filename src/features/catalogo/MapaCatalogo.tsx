// Mapa Leaflet con los 53 municipios como marcadores agrupados (T-10, plan.md
// 6.5). Teselas de OpenStreetMap con atribución visible "© OpenStreetMap
// contributors". Sin precarga ni descarga masiva (la política de OSM lo
// prohíbe); la caché en tiempo de ejecución de las teselas ya vistas la añade
// la PWA (Workbox) en T-14.
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { t } from '@/i18n';
import type { Atraccion, Municipio } from '@/domain/catalogo/esquemas';
import { configurarIconoLeaflet } from './icono-leaflet';

configurarIconoLeaflet();

// Centro aproximado del Eje Cafetero y zoom que abarca los tres departamentos.
const CENTRO: [number, number] = [5.0, -75.6];
const ZOOM_INICIAL = 9;

interface Props {
  municipios: Municipio[];
  atraccionesPorMunicipio: Map<string, Atraccion[]>;
  alAbrirAtraccion: (a: Atraccion) => void;
}

export function MapaCatalogo({
  municipios,
  atraccionesPorMunicipio,
  alAbrirAtraccion,
}: Props) {
  return (
    <div className="h-[60vh] w-full overflow-hidden rounded-lg border border-tinta-200">
      <MapContainer
        center={CENTRO}
        zoom={ZOOM_INICIAL}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MarkerClusterGroup chunkedLoading>
          {municipios.map((m) => {
            const atracciones = atraccionesPorMunicipio.get(m.id) ?? [];
            return (
              <Marker key={m.id} position={[m.lat, m.lon]}>
                <Popup>
                  <div className="flex flex-col gap-1">
                    <strong>{m.nombre}</strong>
                    {m.es_pueblo_patrimonio && (
                      <span className="text-xs text-ambar-700">
                        {t('catalogo.puebloPatrimonio')}
                      </span>
                    )}
                    {atracciones.length === 0 ? (
                      <span className="text-xs text-tinta-500">
                        {t('catalogo.sinAtracciones')}
                      </span>
                    ) : (
                      <ul className="flex flex-col gap-0.5">
                        {atracciones.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => alAbrirAtraccion(a)}
                              className="text-left text-selva-700 underline"
                            >
                              {a.nombre}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
