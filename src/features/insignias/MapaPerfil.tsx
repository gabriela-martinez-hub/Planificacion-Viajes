// Mapa del perfil: los 53 municipios, con los visitados (con check-in)
// resaltados (T-21, plan.md 6.4/6.5). Teselas de OpenStreetMap con atribución
// visible. Se carga diferido (lazy) desde Perfil para no engordar el arranque.
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { t } from '@/i18n';
import type { Municipio } from '@/domain/catalogo/esquemas';

const CENTRO: [number, number] = [5.0, -75.6];
const ZOOM_INICIAL = 9;

// Iconos de círculo con DivIcon: no dependen de imágenes externas y permiten
// distinguir visitado (esmeralda) de pendiente (gris) sin más recursos.
function marcadorCirculo(color: string, borde: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid ${borde};box-shadow:0 0 0 1px rgba(0,0,0,.2)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const ICONO_VISITADO = marcadorCirculo('#4a6734', '#ffffff'); // selva-600
const ICONO_PENDIENTE = marcadorCirculo('#c3ac8d', '#ffffff'); // tinta-300

interface Props {
  municipios: Municipio[];
  /** Ids de municipios con check-in. */
  visitados: Set<string>;
}

export function MapaPerfil({ municipios, visitados }: Props) {
  return (
    <div className="h-[55vh] w-full overflow-hidden rounded-lg border border-tinta-200">
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
            const esVisitado = visitados.has(m.id);
            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lon]}
                icon={esVisitado ? ICONO_VISITADO : ICONO_PENDIENTE}
              >
                <Popup>
                  <div className="flex flex-col gap-1">
                    <strong>{m.nombre}</strong>
                    <span
                      className={
                        esVisitado
                          ? 'text-xs text-selva-700'
                          : 'text-xs text-tinta-500'
                      }
                    >
                      {esVisitado
                        ? t('perfil.municipioVisitado')
                        : t('perfil.municipioPendiente')}
                    </span>
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
