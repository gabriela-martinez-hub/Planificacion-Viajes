// Arregla el icono por defecto de Leaflet con Vite. Leaflet referencia sus
// imágenes por rutas relativas que el bundler rompe; aquí se importan como
// módulos para que Vite les ponga la URL correcta. Se importa una sola vez.
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

let aplicado = false;

export function configurarIconoLeaflet(): void {
  if (aplicado) return;
  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  });
  aplicado = true;
}
