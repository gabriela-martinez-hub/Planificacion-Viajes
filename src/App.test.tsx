import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import App from '@/App';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { textos } from '@/i18n/es-CO';

// El cliente real de Supabase necesita variables de entorno y haría red.
// Se reemplaza por un doble: sin sesión y con lecturas de catálogo vacías.
vi.mock('@/services/supabase', () => {
  const consultaVacia = {
    select: () => consultaVacia,
    order: () => Promise.resolve({ data: [], error: null }),
    then: (resolver: (r: { data: never[]; error: null }) => unknown) =>
      resolver({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => consultaVacia,
    },
  };
});

function envolver(nodo: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>{nodo}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('App', () => {
  it('muestra los textos de la pantalla inicial desde es-CO.ts', () => {
    render(envolver(<App />));
    expect(
      screen.getByRole('heading', { name: textos.app.titulo }),
    ).toBeInTheDocument();
    expect(screen.getByText(textos.app.descripcion)).toBeInTheDocument();
  });

  it('ofrece iniciar sesión con Google cuando no hay sesión', async () => {
    render(envolver(<App />));
    expect(
      await screen.findByRole('button', { name: textos.auth.iniciarSesion }),
    ).toBeInTheDocument();
  });
});
