// Hooks de lectura del catálogo con TanStack Query. Las claves de query son
// estables para que la caché funcione entre pantallas.
import { useQuery } from '@tanstack/react-query';
import {
  obtenerDepartamentos,
  obtenerMunicipios,
  obtenerAtracciones,
} from '@/services/catalogo';

export const clavesCatalogo = {
  departamentos: ['catalogo', 'departamentos'] as const,
  municipios: ['catalogo', 'municipios'] as const,
  atracciones: ['catalogo', 'atracciones'] as const,
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
