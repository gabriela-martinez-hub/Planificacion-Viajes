import { QueryClient } from '@tanstack/react-query';

// Cliente de TanStack Query para toda la app (plan.md 3, 4). El catálogo es de
// solo lectura y cambia poco, así que se cachea de forma larga: no se vuelve a
// pedir al enfocar la ventana y se considera fresco por un buen rato.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hora: el catálogo cambia poco
      gcTime: 1000 * 60 * 60 * 24, // se conserva en memoria 24 h
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
