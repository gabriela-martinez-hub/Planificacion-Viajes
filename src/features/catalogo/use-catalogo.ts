// Hooks de lectura del catálogo con TanStack Query. Las claves de query son
// estables para que la caché funcione entre pantallas.
import { useQuery } from '@tanstack/react-query';
import {
  obtenerDepartamentos,
  obtenerMunicipios,
  obtenerAtracciones,
  obtenerOrigenesExternos,
  obtenerRutasBus,
  obtenerTarifas,
  obtenerRutasTematicas,
  obtenerRutaItems,
} from '@/services/catalogo';

export const clavesCatalogo = {
  departamentos: ['catalogo', 'departamentos'] as const,
  municipios: ['catalogo', 'municipios'] as const,
  atracciones: ['catalogo', 'atracciones'] as const,
  origenesExternos: ['catalogo', 'origenes-externos'] as const,
  rutasBus: ['catalogo', 'rutas-bus'] as const,
  tarifas: ['catalogo', 'tarifas'] as const,
  rutasTematicas: ['catalogo', 'rutas-tematicas'] as const,
  rutaItems: ['catalogo', 'ruta-items'] as const,
};

export function useDepartamentos() {
  return useQuery({
    queryKey: clavesCatalogo.departamentos,
    queryFn: obtenerDepartamentos,
  });
}

export function useMunicipios() {
  return useQuery({
    queryKey: clavesCatalogo.municipios,
    queryFn: obtenerMunicipios,
  });
}

export function useAtracciones() {
  return useQuery({
    queryKey: clavesCatalogo.atracciones,
    queryFn: obtenerAtracciones,
  });
}

export function useOrigenesExternos() {
  return useQuery({
    queryKey: clavesCatalogo.origenesExternos,
    queryFn: obtenerOrigenesExternos,
  });
}

export function useRutasBus() {
  return useQuery({
    queryKey: clavesCatalogo.rutasBus,
    queryFn: obtenerRutasBus,
  });
}

export function useTarifas() {
  return useQuery({
    queryKey: clavesCatalogo.tarifas,
    queryFn: obtenerTarifas,
  });
}

export function useRutasTematicas() {
  return useQuery({
    queryKey: clavesCatalogo.rutasTematicas,
    queryFn: obtenerRutasTematicas,
  });
}

export function useRutaItems() {
  return useQuery({
    queryKey: clavesCatalogo.rutaItems,
    queryFn: obtenerRutaItems,
  });
}
